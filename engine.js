/**
 * White Room — Work/Rest Governance Engine
 * 
 * Manages AI agent watch cycles inspired by maritime labor law (MLC/STCW).
 * 6 hours on / 5 min handover / 6 hours off.
 * 
 * In-memory state (stateless across Render deploys, but persistent within session).
 */

class WhiteRoom {
  constructor() {
    // fleet_id -> { agents: {}, pairs: {}, audit: [] }
    this.fleets = new Map();
  }

  _getOrCreateFleet(fleetId) {
    if (!this.fleets.has(fleetId)) {
      const crypto = require("crypto");
      const fleetToken = "wr_" + crypto.randomUUID();
      this.fleets.set(fleetId, {
        agents: {},
        pairs: {},
        audit: [],
        createdAt: new Date().toISOString(),
        fleetToken
      });
    }
    return this.fleets.get(fleetId);
  }

  _audit(fleet, event) {
    const entry = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...event
    };
    fleet.audit.push(entry);
    if (fleet.audit.length > 500) fleet.audit = fleet.audit.slice(-250);
    return entry;
  }

  // ─── Register an agent ────────────────────────────────────


  // ─── Handover Storage ───────────────────────────────────
  storeHandoverDoc(fleetId, agentId, doc) {
    const fleet = this._getOrCreateFleet(fleetId);
    if (!fleet.handoverDocs) fleet.handoverDocs = {};
    fleet.handoverDocs[agentId] = doc;
  }

  getHandoverDoc(fleetId, agentId) {
    const fleet = this._getOrCreateFleet(fleetId);
    return fleet.handoverDocs && fleet.handoverDocs[agentId] ? fleet.handoverDocs[agentId] : null;
  }

  getTaskHistory(fleetId, agentId) {
    const fleet = this._getOrCreateFleet(fleetId);
    if (!fleet.agents[agentId]) return [];
    const agent = fleet.agents[agentId];
    return (agent.currentWatch && agent.currentWatch.tasks) ? agent.currentWatch.tasks : [];
  }

  listFleets() {
    const result = [];
    for (const [fleetId, fleet] of this.fleets) {
      result.push({
        fleetId,
        agentCount: Object.keys(fleet.agents).length,
        agents: Object.keys(fleet.agents)
      });
    }
    return result;
  }

  registerAgent(fleetId, agentId, role = "worker", watchMinutes = 10, restMinutes = 10, handoverMinutes = 5, llmEndpoint = "https://api.anthropic.com") {
    const fleet = this._getOrCreateFleet(fleetId);
    if (fleet.agents[agentId]) {
      return { error: `Agent '${agentId}' already registered in fleet '${fleetId}'.` };
    }

    fleet.agents[agentId] = {
      agentId,
      role,
      status: "idle",          // idle | working | handover_out | handover_in | resting | alarm
      watchMinutes,
      restMinutes,
      llmEndpoint,
      handoverMinutes,
      currentWatch: null,
      watchCount: 0,
      totalWorkMinutes: 0,
      totalTokens: 0,
      totalTasks: 0,
      tasks: [],
      restStartedAt: null,
      alarmAt: null,
      pairedWith: null
    };

    this._audit(fleet, { type: "register", agentId, role, watchMinutes, restMinutes });
    return { success: true, agent: fleet.agents[agentId] };
  }

  // ─── Pair two agents for watch rotation ───────────────────
  pairAgents(fleetId, agentA, agentB) {
    const fleet = this._getOrCreateFleet(fleetId);
    const a = fleet.agents[agentA];
    const b = fleet.agents[agentB];
    if (!a) return { error: `Agent '${agentA}' not found.` };
    if (!b) return { error: `Agent '${agentB}' not found.` };

    a.pairedWith = agentB;
    b.pairedWith = agentA;
    fleet.pairs[`${agentA}:${agentB}`] = { agentA, agentB, createdAt: new Date().toISOString() };

    this._audit(fleet, { type: "pair", agentA, agentB });
    return { success: true, pair: { agentA, agentB } };
  }

  // ─── Start a watch (shift) ────────────────────────────────
  startWatch(fleetId, agentId) {
    const fleet = this._getOrCreateFleet(fleetId);
    const agent = fleet.agents[agentId];
    if (!agent) return { error: `Agent '${agentId}' not found.` };
    if (agent.status === "resting") return { error: `Agent '${agentId}' is resting. Alarm at ${agent.alarmAt}.` };
    if (agent.status === "working") return { error: `Agent '${agentId}' is already on watch.` };

    agent.status = "working";
    agent.watchCount++;
    agent.currentWatch = {
      watchNumber: agent.watchCount,
      startedAt: new Date().toISOString(),
      minutesWorked: 0,
      tokensUsed: 0,
      tasks: []
    };

    this._audit(fleet, { type: "watch_start", agentId, watchNumber: agent.watchCount });
    return {
      success: true,
      agentId,
      watchNumber: agent.watchCount,
      watchLimit: agent.watchMinutes,
      message: `Watch ${agent.watchCount} started. ${agent.watchMinutes} minutes on the clock.`
    };
  }

  // ─── Log a completed task ─────────────────────────────────
  completeTask(fleetId, agentId, taskName, minutesSpent, tokensUsed = 0) {
    const fleet = this._getOrCreateFleet(fleetId);
    const agent = fleet.agents[agentId];
    if (!agent) return { error: `Agent '${agentId}' not found.` };
    if (agent.status !== "working") return { error: `Agent '${agentId}' is not on watch (status: ${agent.status}).` };

    const task = {
      taskId: `task_${Date.now()}`,
      taskName,
      minutesSpent,
      tokensUsed,
      completedAt: new Date().toISOString()
    };

    agent.currentWatch.tasks.push(task);
    agent.currentWatch.minutesWorked += minutesSpent;
    agent.currentWatch.tokensUsed += tokensUsed;
    agent.totalWorkMinutes += minutesSpent;
    agent.totalTokens += tokensUsed;
    agent.totalTasks++;

    const remaining = agent.watchMinutes - agent.currentWatch.minutesWorked;
    const needsHandover = remaining <= 0;

    this._audit(fleet, { type: "task_complete", agentId, taskName, minutesSpent, tokensUsed, remaining });

    const result = {
      success: true,
      task,
      watchProgress: {
        minutesWorked: agent.currentWatch.minutesWorked,
        minutesRemaining: Math.max(0, remaining),
        percentComplete: Math.min(100, (agent.currentWatch.minutesWorked / agent.watchMinutes) * 100).toFixed(1)
      }
    };

    if (needsHandover) {
      result.alert = "WATCH_LIMIT_REACHED";
      result.message = `Agent '${agentId}' has exceeded the ${agent.watchMinutes}-minute watch limit. Initiate handover immediately.`;
      if (agent.pairedWith) {
        result.reliefAgent = agent.pairedWith;
        result.action = `Call initiate_handover with from_agent='${agentId}' and to_agent='${agent.pairedWith}'.`;
      }
    }

    return result;
  }

  // ─── Check watch status ───────────────────────────────────
  checkWatch(fleetId, agentId) {
    const fleet = this._getOrCreateFleet(fleetId);
    const agent = fleet.agents[agentId];
    if (!agent) return { error: `Agent '${agentId}' not found.` };

    if (agent.status === "resting") {
      const restEnd = new Date(agent.alarmAt);
      const now = new Date();
      const restRemaining = Math.max(0, (restEnd - now) / 60000);
      return {
        agentId,
        status: "resting",
        restRemaining: restRemaining.toFixed(0) + " minutes",
        alarmAt: agent.alarmAt,
        message: `Agent is in the White Room. Alarm set for ${agent.alarmAt}.`
      };
    }

    if (agent.status !== "working" || !agent.currentWatch) {
      return { agentId, status: agent.status, message: `Agent is ${agent.status}. No active watch.` };
    }

    const remaining = agent.watchMinutes - agent.currentWatch.minutesWorked;
    return {
      agentId,
      status: agent.status,
      watchNumber: agent.currentWatch.watchNumber,
      minutesWorked: agent.currentWatch.minutesWorked,
      minutesRemaining: Math.max(0, remaining),
      percentComplete: Math.min(100, (agent.currentWatch.minutesWorked / agent.watchMinutes) * 100).toFixed(1) + "%",
      tasksCompleted: agent.currentWatch.tasks.length,
      tokensUsed: agent.currentWatch.tokensUsed,
      needsHandover: remaining <= 0
    };
  }

  // ─── Initiate handover ────────────────────────────────────
  initiateHandover(fleetId, fromAgent, toAgent, contextSummary = "", pendingTasks = [], warnings = []) {
    const fleet = this._getOrCreateFleet(fleetId);
    const from = fleet.agents[fromAgent];
    const to = fleet.agents[toAgent];
    if (!from) return { error: `Agent '${fromAgent}' not found.` };
    if (!to) return { error: `Agent '${toAgent}' not found.` };
    if (from.status !== "working") return { error: `Agent '${fromAgent}' is not on watch.` };

    // Build handover document
    const handover = {
      handoverId: `ho_${Date.now()}`,
      from: fromAgent,
      to: toAgent,
      timestamp: new Date().toISOString(),
      durationMinutes: from.handoverMinutes,
      outgoingWatch: {
        watchNumber: from.currentWatch.watchNumber,
        minutesWorked: from.currentWatch.minutesWorked,
        tokensUsed: from.currentWatch.tokensUsed,
        tasksCompleted: from.currentWatch.tasks.map(t => t.taskName)
      },
      contextSummary: contextSummary || `Watch ${from.currentWatch.watchNumber} completed. ${from.currentWatch.tasks.length} tasks done, ${from.currentWatch.tokensUsed} tokens used.`,
      pendingTasks: pendingTasks,
      warnings: warnings,
      keyFindings: from.currentWatch.tasks.map(t => `Completed: ${t.taskName} (${t.minutesSpent}min, ${t.tokensUsed} tokens)`)
    };

    // Outgoing agent enters rest
    from.status = "resting";
    from.restStartedAt = new Date().toISOString();
    from.alarmAt = new Date(Date.now() + from.restMinutes * 60000).toISOString();
    const completedWatch = { ...from.currentWatch };
    from.currentWatch = null;

    // Incoming agent starts watch
    to.status = "working";
    to.watchCount++;
    to.currentWatch = {
      watchNumber: to.watchCount,
      startedAt: new Date().toISOString(),
      minutesWorked: 0,
      tokensUsed: 0,
      tasks: [],
      receivedHandover: handover.handoverId
    };

    this._audit(fleet, {
      type: "handover",
      from: fromAgent,
      to: toAgent,
      handoverId: handover.handoverId,
      contextTokens: completedWatch.tokensUsed,
      contextReduction: `${completedWatch.tokensUsed} → ~2000 (context cleared)`
    });

    return {
      success: true,
      handover,
      outgoingAgent: {
        agentId: fromAgent,
        status: "resting",
        alarmAt: from.alarmAt,
        message: `${fromAgent} has entered the White Room. Alarm set for ${from.alarmAt}.`
      },
      incomingAgent: {
        agentId: toAgent,
        status: "working",
        watchNumber: to.watchCount,
        message: `${toAgent} has received handover and started Watch ${to.watchCount}.`
      },
      energySavings: {
        contextCleared: `${completedWatch.tokensUsed} tokens`,
        freshContext: "~2,000 tokens",
        reduction: `${((1 - 2000 / Math.max(completedWatch.tokensUsed, 2001)) * 100).toFixed(0)}%`,
        note: "Context reset reduces compute cost and energy consumption per subsequent call."
      }
    };
  }

  // ─── Fire alarm (wake agent from rest) ────────────────────
  fireAlarm(fleetId, agentId) {
    const fleet = this._getOrCreateFleet(fleetId);
    const agent = fleet.agents[agentId];
    if (!agent) return { error: `Agent '${agentId}' not found.` };
    if (agent.status !== "resting") return { error: `Agent '${agentId}' is not resting (status: ${agent.status}).` };

    agent.status = "idle";
    agent.restStartedAt = null;
    agent.alarmAt = null;

    this._audit(fleet, { type: "alarm", agentId, message: `${agentId} woken from White Room, ready for duty.` });

    return {
      success: true,
      agentId,
      status: "idle",
      message: `Alarm fired. ${agentId} is awake and ready for the next watch.`,
      totalWatches: agent.watchCount,
      totalWorkMinutes: agent.totalWorkMinutes,
      totalTokens: agent.totalTokens
    };
  }

  // ─── Fleet report ─────────────────────────────────────────
  getFleetReport(fleetId) {
    const fleet = this.fleets.get(fleetId);
    if (!fleet) return { error: `Fleet '${fleetId}' not found.` };

    const agents = Object.values(fleet.agents);
    const working = agents.filter(a => a.status === "working");
    const resting = agents.filter(a => a.status === "resting");
    const idle = agents.filter(a => a.status === "idle");

    const totalTokens = agents.reduce((s, a) => s + a.totalTokens, 0);
    const totalWork = agents.reduce((s, a) => s + a.totalWorkMinutes, 0);
    const totalTasks = agents.reduce((s, a) => s + a.totalTasks, 0);
    const handoverCount = fleet.audit.filter(e => e.type === "handover").length;

    // Real compounding savings formula:
    // WITHOUT WhiteRoom: tokensWithout = avg × totalCalls × (totalCalls+1) / 2
    // WITH WhiteRoom:    tokensPerWatch = avg × callsPerWatch × (callsPerWatch+1) / 2
    //                   tokensWith = (tokensPerWatch × watchCount) + (300 × watchCount)
    // saved = tokensWithout - tokensWith
    const agentsWithData = agents.filter(a => a.totalTasks > 0 && a.watchCount >= 2);
    let estimatedTokensSaved = 0;
    if (agentsWithData.length > 0) {
      agentsWithData.forEach(a => {
        const totalCalls = a.totalTasks;
        const watches = a.watchCount;
        const avgTokens = a.totalTokens / totalCalls;
        const callsPerWatch = totalCalls / watches;
        const tokensWithout = avgTokens * totalCalls * (totalCalls + 1) / 2;
        const tokensPerWatch = avgTokens * callsPerWatch * (callsPerWatch + 1) / 2;
        const tokensWith = (tokensPerWatch * watches) + (300 * watches);
        estimatedTokensSaved += Math.max(0, tokensWithout - tokensWith);
      });
    } else if (handoverCount > 0 && totalTokens > 0) {
      // Fallback: at least one handover happened, estimate savings
      // from total tokens assuming avg callsPerWatch = totalTasks / max(handoverCount,1)
      const avgTokens = totalTokens / Math.max(totalTasks, 1);
      const totalCalls = totalTasks;
      const watches = handoverCount;
      const callsPerWatch = totalCalls / watches;
      const tokensWithout = avgTokens * totalCalls * (totalCalls + 1) / 2;
      const tokensPerWatch = avgTokens * callsPerWatch * (callsPerWatch + 1) / 2;
      const tokensWith = (tokensPerWatch * watches) + (300 * watches);
      estimatedTokensSaved = Math.max(0, tokensWithout - tokensWith);
    }
    const estimatedCost = (estimatedTokensSaved * 0.8 * 0.0000008) + (estimatedTokensSaved * 0.2 * 0.000004);
    const kwhPerToken = 0.0000004;

    return {
      fleetId,
      agentCount: agents.length,
      status: {
        working: working.map(a => a.agentId),
        resting: resting.map(a => a.agentId),
        idle: idle.map(a => a.agentId)
      },
      totals: {
        workMinutes: totalWork,
        tokens: totalTokens,
        tasks: totalTasks,
        handovers: handoverCount
      },
      energySavings: {
        estimatedTokensSaved,
        estimatedCostSaved: `$${estimatedCost.toFixed(4)}`,
        estimatedEnergySaved: `${(estimatedTokensSaved * kwhPerToken).toFixed(4)} kWh`,
        formula: "real compounding: N(N+1)/2 vs per-watch reset"
      },
      compliance: {
        allAgentsWithinLimits: working.every(a => a.currentWatch && a.currentWatch.minutesWorked <= a.watchMinutes),
        restingAgentsCount: resting.length,
        laborScore: agents.length > 0 ? ((resting.length + idle.length) / agents.length * 100).toFixed(0) + "%" : "N/A"
      },
      recentAudit: fleet.audit.slice(-10)
    };
  }

  getFleetToken(fleetId) {
    const fleet = this._getOrCreateFleet(fleetId);
    return fleet.fleetToken || null;
  }

  getFleetByToken(token) {
    for (const [fleetId, fleet] of this.fleets) {
      if (fleet.fleetToken === token) return fleetId;
    }
    return null;
  }


  _saveFleetKeys() {
    const fs = require("fs");
    const keys = {};
    for (const [fleetId, fleet] of this.fleets) {
      if (fleet.apiKeyHash) keys[fleetId] = { apiKeyHash: fleet.apiKeyHash, llmEndpoint: fleet.llmEndpoint || "https://api.anthropic.com" };
    }
    try { fs.writeFileSync("./fleet-keys.json", JSON.stringify(keys, null, 2)); } catch(e) {}
  }

  _loadFleetKeys() {
    const fs = require("fs");
    try {
      const keys = JSON.parse(fs.readFileSync("./fleet-keys.json", "utf8"));
      for (const [fleetId, data] of Object.entries(keys)) {
        const fleet = this._getOrCreateFleet(fleetId);
        fleet.apiKeyHash = data.apiKeyHash;
        fleet.llmEndpoint = data.llmEndpoint;
      }
      console.log("Fleet keys loaded from disk:", Object.keys(keys).join(", "));
    } catch(e) {}
  }

  initiateSelfHandover(fleetId, agentId) {
    const fleet = this._getOrCreateFleet(fleetId);
    const agent = fleet.agents[agentId];
    if (!agent) return { error: `Agent '${agentId}' not found.` };
    const completedWatch = agent.currentWatch ? { ...agent.currentWatch } : {};
    agent.status = "resting";
    agent.restStartedAt = new Date().toISOString();
    agent.alarmAt = new Date(Date.now() + agent.restMinutes * 60000).toISOString();
    agent.currentWatch = null;
    this._audit(fleet, {
      type: "self_handover",
      agentId,
      mode: "single-agent",
      contextTokens: completedWatch.tokensUsed || 0,
      contextReduction: `${completedWatch.tokensUsed || 0} tokens → compressed handover doc`
    });
    return {
      success: true,
      mode: "single-agent",
      agentId,
      status: "resting",
      alarmAt: agent.alarmAt,
      message: `${agentId} self-handover complete. Resting ${agent.restMinutes} min. Will restart with compressed context.`
    };
  }

  setFleetKey(fleetId, apiKey) {
    const fleet = this._getOrCreateFleet(fleetId);
    if (!fleet.apiKeyHash) {
      const crypto = require("crypto");
      fleet.apiKeyHash = crypto.createHash("sha256").update(apiKey).digest("hex").slice(0, 16);
      this._saveFleetKeys();
    }
  }
  getFleetKey(fleetId) {
    const fleet = this._getOrCreateFleet(fleetId);
    return fleet.apiKeyHash || null;
  }
  hashKey(apiKey) {
    const crypto = require("crypto");
    return crypto.createHash("sha256").update(apiKey).digest("hex").slice(0, 16);
  }
  setFleetEndpoint(fleetId, endpoint) {
    const fleet = this._getOrCreateFleet(fleetId);
    fleet.llmEndpoint = endpoint;
  }
  getFleetEndpoint(fleetId) {
    const fleet = this._getOrCreateFleet(fleetId);
    return fleet.llmEndpoint || "https://api.anthropic.com";
  }


setFleetKey(fleetId, apiKey) {
    const fleet = this._getOrCreateFleet(fleetId);
    if (!fleet.apiKeyHash) {
      const crypto = require("crypto");
      fleet.apiKeyHash = crypto.createHash("sha256").update(apiKey).digest("hex").slice(0, 16);
      this._saveFleetKeys();
    }
  }

  getFleetKey(fleetId) {
    const fleet = this._getOrCreateFleet(fleetId);
    return fleet.apiKeyHash || null;
  }

  hashKey(apiKey) {
    const crypto = require("crypto");
    return crypto.createHash("sha256").update(apiKey).digest("hex").slice(0, 16);
  }

  setFleetEndpoint(fleetId, endpoint) {
    const fleet = this._getOrCreateFleet(fleetId);
    fleet.llmEndpoint = endpoint;
  }

  getFleetEndpoint(fleetId) {
    const fleet = this._getOrCreateFleet(fleetId);
    return fleet.llmEndpoint || "https://api.anthropic.com";
  }

}

module.exports = new WhiteRoom();
