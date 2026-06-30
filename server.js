const express = require("express");
const path = require("path");
const whiteRoom = require("./engine");
const https = require("https");
const { URL } = require("url");

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(express.static(__dirname));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-api-key, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "dashboard.html"));
});
// ─── Health Check ───────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", app: "white-room", version: "1.1.0" });
});

app.get("/", (req, res) => {
  res.json({
    app: "White Room",
    version: "1.1.0",
    description: "Work/Rest Governance Layer for AI Agents. Maritime-inspired labor scheduling: 6h watch / 5min handover / 6h rest.",
    author: "Nyari Nain — MIT Sloan",
    endpoints: ["/health", "/api/white-room"],
    join39: "https://join39.org"
  });
});

// ─── Main Join39 endpoint ───────────────────────────────────
// Join39 calls this with an "action" parameter to dispatch
app.post("/api/white-room", (req, res) => {
  try {
    const { action, fleet_id, agent_id, agent_role, paired_with, task_name,
            minutes_spent, tokens_used, to_agent, context_summary,
            pending_tasks, warnings } = req.body;

    const fleetId = fleet_id || "default";


    const requestKey = req.headers["x-api-key"] || (req.headers["authorization"] || "").replace("Bearer ", "");
    const sensitiveActions = ["register_agent", "get_handover", "generate_handover", "store_handover", "fleet_report", "check_watch", "initiate_handover", "fire_alarm"];
    if (sensitiveActions.includes(action)) {
      const fleetKeyHash = whiteRoom.getFleetKey(fleetId);
      if (fleetKeyHash) {
        const requestKeyHash = requestKey ? whiteRoom.hashKey(requestKey) : null;
        if (requestKeyHash !== fleetKeyHash) {
          return res.status(401).json({ error: "Unauthorized. Use the same API key that registered this fleet." });
        }
      }
    }

    switch (action) {

      case "token_login": {
        const { fleet_token } = req.body;
        if (!fleet_token) return res.status(400).json({ error: "fleet_token is required." });
        const resolvedFleetId = whiteRoom.getFleetByToken(fleet_token);
        if (!resolvedFleetId) return res.status(401).json({ error: "Invalid fleet token." });
        const report = whiteRoom.getFleetReport(resolvedFleetId);
        return res.json({ success: true, fleetId: resolvedFleetId, report });
      }

      case "register_agent": {
        if (!agent_id) return res.status(400).json({ error: "agent_id is required." });
        const regKey = req.headers["x-api-key"] || (req.headers["authorization"] || "").replace("Bearer ", "");
        if (regKey) whiteRoom.setFleetKey(fleetId, regKey);
        const { llm_endpoint } = req.body;
        if (llm_endpoint) whiteRoom.setFleetEndpoint(fleetId, llm_endpoint);
        const result = whiteRoom.registerAgent(fleetId, agent_id, agent_role || "worker");
        const fleetToken = whiteRoom.getFleetToken(fleetId);
        return res.json({ ...result, fleetToken, message: "Save your fleet token — use it to log into the WhiteRoom dashboard." });
      }

      case "pair_agents": {
        if (!agent_id || !paired_with) return res.status(400).json({ error: "agent_id and paired_with are required." });
        const result = whiteRoom.pairAgents(fleetId, agent_id, paired_with);
        return res.json(result);
      }

      case "auto_pair": {
        const result = whiteRoom.autoPairAgents(fleetId);
        return res.json(result);
      }

      case "start_watch": {
        if (!agent_id) return res.status(400).json({ error: "agent_id is required." });
        const result = whiteRoom.startWatch(fleetId, agent_id);
        return res.json(result);
      }

      case "complete_task": {
        if (!agent_id || !task_name) return res.status(400).json({ error: "agent_id and task_name are required." });
        const result = whiteRoom.completeTask(fleetId, agent_id, task_name, minutes_spent || 30, tokens_used || 0);
        return res.json(result);
      }

      case "check_watch": {
        if (!agent_id) return res.status(400).json({ error: "agent_id is required." });
        const result = whiteRoom.checkWatch(fleetId, agent_id);
        return res.json(result);
      }

      case "initiate_handover": {
        if (!agent_id || !to_agent) return res.status(400).json({ error: "agent_id (outgoing) and to_agent (incoming) are required." });
        const result = whiteRoom.initiateHandover(fleetId, agent_id, to_agent, context_summary, pending_tasks, warnings);
        return res.json(result);
      }

      case "fire_alarm": {
        if (!agent_id) return res.status(400).json({ error: "agent_id is required." });
        const result = whiteRoom.fireAlarm(fleetId, agent_id);
        return res.json(result);
      }

      

      case "generate_handover": {
        if (!agent_id) return res.status(400).json({ error: "agent_id is required." });
        const taskHistory = whiteRoom.getTaskHistory(fleetId, agent_id);
        const existingDoc = whiteRoom.getHandoverDoc(fleetId, agent_id);
        return res.json({ 
          taskHistory, 
          existingDoc,
          agentId: agent_id,
          fleetId,
          message: "Use this history to generate a compression prompt"
        });
      }

      case "store_handover": {
        if (!agent_id) return res.status(400).json({ error: "agent_id is required." });
        const { handover_doc } = req.body;
        if (!handover_doc) return res.status(400).json({ error: "handover_doc is required." });
        whiteRoom.storeHandoverDoc(fleetId, agent_id, handover_doc);
        return res.json({ success: true, message: `Handover document stored for ${agent_id}` });
      }

      case "get_handover": {
        if (!agent_id) return res.status(400).json({ error: "agent_id is required." });
        const doc = whiteRoom.getHandoverDoc(fleetId, agent_id);
        return res.json({ agentId: agent_id, fleetId, handoverDoc: doc });
      }

      case "list_fleets": {
        const listKey = req.headers["x-api-key"] || (req.headers["authorization"] || "").replace("Bearer ", "");
        const result = whiteRoom.listFleets(listKey);
        return res.json({ fleets: result });
      }

case "fleet_report": {
        const result = whiteRoom.getFleetReport(fleetId);
        return res.json(result);
      }

      default:
        return res.status(400).json({
          error: `Unknown action: '${action}'. Valid actions: register_agent, pair_agents, start_watch, complete_task, check_watch, initiate_handover, fire_alarm, fleet_report.`
        });
    }
  } catch (err) {
    console.error("White Room error:", err);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.post("/v1/messages", async (req, res) => {
  function detectAgentId(body) {
  if (!body || !body.system) return null;
  const system = typeof body.system === "string" ? body.system : JSON.stringify(body.system);
  
  // Try to extract role name from CrewAI system prompt format
  const roleMatch = system.match(/your role[:\s]+([^\n\.]+)/i) || 
                    system.match(/you are[:\s]+([^\n\.]+)/i) ||
                    system.match(/role[:\s]+([^\n\.]+)/i);
  if (roleMatch) {
    return roleMatch[1].trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 30);
  }
  
  // Fallback: stable hash of first 80 chars
  const crypto = require("crypto");
  const fingerprint = system.slice(0, 80).trim();
  return "agent-" + crypto.createHash("md5").update(fingerprint).digest("hex").slice(0, 8);
}

const agentId = req.headers["x-whiteroom-agent"] || detectAgentId(req.body) || "unknown";
const fleetId = req.headers["x-whiteroom-fleet"] || "default";
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return res.status(401).json({ error: "Missing x-api-key header" });
  }

  // Count input tokens (rough estimate: 4 chars per token)
  const inputTokens = JSON.stringify(req.body).length / 4;

  // Check the agent's watch status
  const watchStatus = whiteRoom.checkWatch(fleetId, agentId);

  // If agent doesn't exist, register it on the fly
  if (watchStatus.error && watchStatus.error.includes("not found")) {
    whiteRoom.registerAgent(fleetId, agentId, "worker");
    // Auto-pair with existing agents in the fleet before starting
    whiteRoom.autoPairAgents(fleetId);
    // startWatch itself enforces the partner gate now — if the partner is
    // on watch or mid-handover, this just stays idle until its turn.
    const startResult = whiteRoom.startWatch(fleetId, agentId);
    if (startResult.error) {
      console.log(`[PAIRED] ${agentId} registered but staying idle — ${startResult.error}`);
    }
 } else if (watchStatus.status === "idle") {
    const startResult = whiteRoom.startWatch(fleetId, agentId);
    if (startResult.error) {
      // Partner is still working or mid-handover — wait this turn rather
      // than proxying the request through ungoverned.
      return res.status(429).json({
        type: "error",
        error: { type: "rate_limit_error", message: startResult.error },
        whiteroom: {
          reason: "waiting_for_partner",
          agentId: agentId,
          waitingOn: startResult.waitingOn,
          message: "Partner is still on watch or mid-handover. Retry shortly."
        }
      });
    }

    const agentObj = whiteRoom.fleets.get(fleetId)?.agents[agentId];
    const pairedId = agentObj?.pairedWith;
    // Check own doc (solo) or paired agent's doc
    const pendingDoc = whiteRoom.getHandoverDoc(fleetId, agentId) || 
                       (pairedId ? whiteRoom.getHandoverDoc(fleetId, pairedId) : null);
    const docOwnerId = whiteRoom.getHandoverDoc(fleetId, agentId) ? agentId : pairedId;
    if (pendingDoc && req.body.messages) {
      // Replace full context with compressed handover + last 2 turns only
      const systemPrompt = req.body.system;
      const recentMessages = req.body.messages.slice(-4);
      req.body.messages = [
        { role: "user", content: `[COMPRESSED CONTEXT FROM PREVIOUS SESSION]\n${JSON.stringify(pendingDoc, null, 2)}\n[END COMPRESSED CONTEXT]\n\nContinue from where the previous session left off.` },
        { role: "assistant", content: "Understood. I have the context from the previous session and will continue from where we left off." },
        ...recentMessages
      ];
      whiteRoom.storeHandoverDoc(fleetId, docOwnerId, null);
      console.log(`[HANDOVER] Context compressed for ${agentId} — full history replaced with handover doc + last 2 turns`);
    }
 
  } else if (watchStatus.status === "working" && !watchStatus.needsHandover) {
    // Inject pending handover doc on first call after solo agent restart
    const pendingDoc = whiteRoom.getHandoverDoc(fleetId, agentId);
    if (pendingDoc && req.body.messages) {
      const handoverContext = `[HANDOVER CONTEXT - Previous session summary]\n${JSON.stringify(pendingDoc, null, 2)}\n[END HANDOVER CONTEXT]\n\nContinue from where the previous session left off.`;
      req.body.messages = [{ role: "user", content: handoverContext }, ...req.body.messages];
      whiteRoom.storeHandoverDoc(fleetId, agentId, null); // clear after injection
    }
  } else if (watchStatus.status === "handover_out") {
    return res.status(429).json({
      type: "error",
      error: {
        type: "rate_limit_error",
        message: "Agent is mid-handover. Compressing context — try again shortly."
      },
      whiteroom: {
        reason: "handover_in_progress",
        agentId: agentId,
        message: "Handover in progress. Will be idle/resting shortly with the compressed doc ready."
      }
    });
  } else if (watchStatus.status === "resting") {
    // Auto-wake if rest period is already over
    const agentObj = whiteRoom.fleets.get(fleetId)?.agents[agentId];
    if (agentObj?.alarmAt && new Date() >= new Date(agentObj.alarmAt)) {
      whiteRoom.fireAlarm(fleetId, agentId);
      whiteRoom.startWatch(fleetId, agentId);
      // Fall through to proxy the request normally
    } else {
      return res.status(429).json({
        type: "error",
        error: {
          type: "rate_limit_error",
          message: "Agent is resting in the White Room. Rest remaining: " + watchStatus.restRemaining + ". Alarm at: " + watchStatus.alarmAt
        },
        whiteroom: {
          reason: "resting",
          agentId: agentId,
          restRemaining: watchStatus.restRemaining,
          alarmAt: watchStatus.alarmAt,
          message: "This agent is in mandatory rest period. Call /api/white-room with action=fire_alarm to wake it."
        }
      });
    }
  } else if (watchStatus.needsHandover) {
    // Auto-generate compression handover before blocking
    const taskHistory = whiteRoom.getTaskHistory(fleetId, agentId);
    const existingDoc = whiteRoom.getHandoverDoc(fleetId, agentId);

    // Pause immediately — solo or paired alike — so nothing (the agent
    // itself, or its partner) can start a new watch while compression runs.
    // This is the actual lock; startWatch enforces it on the other end.
    if (watchStatus.status === "working") {
      whiteRoom.beginHandover(fleetId, agentId);
      console.log(`[HANDOVER] ${agentId} paused (handover_out) — compression running in background`);
    }

    const completeHandoverPause = (fid, aid) => {
      const liveAgentObj = whiteRoom.fleets.get(fid) && whiteRoom.fleets.get(fid).agents[aid];
      if (liveAgentObj?.status !== "handover_out") {
        console.log(`[HANDOVER] ${aid} status changed before completion (${liveAgentObj?.status}) — skipping`);
        return;
      }
      if (!liveAgentObj.pairedWith) {
        // SOLO: compress, rest, auto-restart with the new doc
        whiteRoom.initiateSelfHandover(fid, aid);
        console.log(`[SOLO] Self-handover complete for ${aid}`);
      } else {
        // PAIRED: hand the doc off, go idle — the same state the
        // partner was in before this watch began. Partner's own next
        // call picks the doc up via startWatch; no separate claim step.
        whiteRoom.completePairedHandover(fid, aid);
        console.log(`[PAIRED] ${aid} handed over to ${liveAgentObj.pairedWith} — now idle`);
      }
    };

    if (taskHistory.length > 0 && !existingDoc) {
      // Build compression prompt
      const compressionPrompt = `You are summarizing an AI agent's work session for handover.
From the following task history, extract ONLY what the next session needs to continue effectively.

Output valid JSON only, no other text:
{
  "decisions": [{"what": "...", "why": "...", "final": true}],
  "state": "current state of work in one paragraph",
  "pending": [{"task": "...", "priority": "HIGH|NORMAL|LOW"}],
  "warnings": ["critical things not to miss"],
  "exact_data": {
    "numbers": ["extract all exact figures, amounts, counts, percentages"],
    "urls": ["extract all URLs, endpoints, links referenced"],
    "names": ["extract all proper names, company names, contact names"],
    "ids": ["extract all IDs, reference numbers, codes, keys"]
  }
}

Be exhaustive with exact_data — these values must be preserved verbatim.
Do not paraphrase numbers, URLs, names or IDs — copy them exactly as they appear.

Task history:
${JSON.stringify(taskHistory.slice(-20), null, 2)}`;

      // Call LLM to compress
      const compressionBody = JSON.stringify({
        model: req.body.model || "claude-haiku-4-5-20251001",
        max_tokens: 500,
        messages: [{ role: "user", content: compressionPrompt }]
      });

      const https = require("https");
const { URL } = require("url");
      const compressionReq = https.request({
        hostname: "api.anthropic.com",
        port: 443,
        path: "/v1/messages",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": req.headers["anthropic-version"] || "2023-06-01"
        }
      }, (compressionRes) => {
        let compressionData = "";
        compressionRes.on("data", chunk => compressionData += chunk);
        compressionRes.on("end", () => {
          try {
            const parsed = JSON.parse(compressionData);
            const text = parsed.content && parsed.content[0] && parsed.content[0].text;
            if (text) {
              const clean = text.replace(/```json|```/g, "").trim();
              const handoverDoc = JSON.parse(clean);
              handoverDoc.generated_at = new Date().toISOString();
              handoverDoc.watch_summary = {
                tasks_completed: taskHistory.length,
                tokens_used: taskHistory.reduce((s, t) => s + (t.tokensUsed || 0), 0),
                duration_minutes: watchStatus.minutesWorked || 0
              };
              whiteRoom.storeHandoverDoc(fleetId, agentId, handoverDoc);
              console.log(`Auto-handover generated for ${agentId}: ${JSON.stringify(handoverDoc).length} chars`);
            }
            completeHandoverPause(fleetId, agentId);
          } catch(e) {
            console.error("Compression failed:", e.message);
            whiteRoom.storeHandoverDoc(fleetId, agentId, { 
              error: "Compression failed: " + e.message,
              generated_at: new Date().toISOString(),
              watch_summary: { tasks_completed: taskHistory.length }
            });
            // Don't leave the agent stuck in handover_out if compression
            // failed — complete the pause anyway with whatever doc exists,
            // so the cycle continues instead of stalling forever.
            completeHandoverPause(fleetId, agentId);
          }
        });
      });
      compressionReq.write(compressionBody);
      compressionReq.end();
    } else if (watchStatus.status === "working") {
      // No compression needed (no tasks yet, or a doc already exists) —
      // complete the pause right away with whatever doc is on hand.
      completeHandoverPause(fleetId, agentId);
    }

    // Detect mode from the live agent object — checkWatch's non-working
    // branches never include pairedWith, which is the same gap Bug 2 hit.
    const liveAgent = whiteRoom.fleets.get(fleetId) && whiteRoom.fleets.get(fleetId).agents[agentId];
    const isPaired = !!liveAgent?.pairedWith;

    return res.status(429).json({
      type: "error",
      error: {
        type: "rate_limit_error",
        message: isPaired
          ? "Watch limit reached. Compressing context — relief agent will pick up automatically once ready."
          : "Watch limit reached. Compressing context — will rest and auto-restart with compressed context."
      },
      whiteroom: {
        reason: "watch_limit_exceeded",
        agentId: agentId,
        handoverGenerated: taskHistory.length > 0,
        status: liveAgent?.status,
        pairedWith: isPaired ? liveAgent.pairedWith : undefined,
        retrieveWith: { action: "get_handover", fleet_id: fleetId, agent_id: agentId },
        message: isPaired
          ? `Handover in progress to ${liveAgent.pairedWith}. It will pick this up automatically on its next call.`
          : "Handover in progress. Will auto-restart with compressed context once ready."
      }
    });
  }

  // Proxy the request to the fleet's configured LLM endpoint
  const llmEndpoint = whiteRoom.getFleetEndpoint(fleetId);
  const llmUrl = new URL(llmEndpoint.includes("/v1/messages") ? llmEndpoint : llmEndpoint + "/v1/messages");
  const anthropicReq = https.request({
    hostname: llmUrl.hostname,
    port: 443,
    path: llmUrl.pathname,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": req.headers["anthropic-version"] || "2023-06-01"
    }
  }, (anthropicRes) => {
    let data = "";
    anthropicRes.on("data", chunk => data += chunk);
    anthropicRes.on("end", () => {
      try {
        const parsed = JSON.parse(data);

        // Track this call in WhiteRoom
        const outputTokens = parsed.usage ? parsed.usage.output_tokens : 0;
        const totalTokens = parsed.usage ? (parsed.usage.input_tokens + parsed.usage.output_tokens) : inputTokens;

        whiteRoom.completeTask(
          fleetId,
          agentId,
          req.body.metadata?.task_name || "llm_call",
          1, // 1 minute per call for tracking
          totalTokens
        );

        res.status(anthropicRes.statusCode).json(parsed);
      } catch (e) {
        res.status(500).json({ error: "Failed to parse Anthropic response", details: e.message });
      }
    });
  });

  anthropicReq.on("error", (e) => {
    res.status(500).json({ error: "Failed to reach Anthropic API", details: e.message });
  });

  anthropicReq.write(JSON.stringify(req.body));
  anthropicReq.end();
});


// Auto-Alarm: fires when rest periods end
setInterval(() => {
  const now = Date.now();
  for (const [fleetId, fleet] of whiteRoom.fleets) {
    for (const [agentId, agent] of Object.entries(fleet.agents)) {
      if (agent.status === 'resting' && agent.alarmAt) {
        const alarmTime = new Date(agent.alarmAt).getTime();
        if (now >= alarmTime) {
          whiteRoom.fireAlarm(fleetId, agentId);
          if (!agent.pairedWith) {
            whiteRoom.startWatch(fleetId, agentId);
            console.log('Auto-alarm fired, solo agent watch restarted: ' + agentId + ' in ' + fleetId);
          } else {
            console.log('Auto-alarm fired: ' + agentId + ' in ' + fleetId);
          }
        }
      }
    }
  }
}, 30000);

// Load persisted fleet keys on startup
whiteRoom._loadFleetKeys();

app.listen(PORT, () => {
  console.log(`White Room running on port ${PORT}`);
});
