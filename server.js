const express = require("express");
const path = require("path");
const whiteRoom = require("./engine");
const https = require("https");
const { URL } = require("url");

const app = express();
app.use(express.json());
app.use(express.static(__dirname));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
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
    const sensitiveActions = ["get_handover", "generate_handover", "store_handover", "fleet_report", "check_watch", "initiate_handover", "fire_alarm"];
    if (sensitiveActions.includes(action) && requestKey) {
      const fleetKeyHash = whiteRoom.getFleetKey(fleetId);
      if (fleetKeyHash) {
        const requestKeyHash = whiteRoom.hashKey(requestKey);
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
    whiteRoom.startWatch(fleetId, agentId);
  } else if (watchStatus.status === "alarm") {
    // Agent rested — fire alarm and inject handover doc into next request
    whiteRoom.fireAlarm(fleetId, agentId);
    const handoverDoc = whiteRoom.getHandoverDoc(fleetId, agentId);
    if (handoverDoc && req.body.messages) {
      const handoverContext = `[HANDOVER CONTEXT - Previous session summary]\n${JSON.stringify(handoverDoc, null, 2)}\n[END HANDOVER CONTEXT]\n\nContinue from where the previous session left off.`;
      req.body.messages = [{ role: "user", content: handoverContext }, ...req.body.messages];
      whiteRoom.storeHandoverDoc(fleetId, agentId, null); // clear after injection
    }
  } else if (watchStatus.status === "resting") {
    return res.status(429).json({
      type: "error",
      error: {
        type: "rate_limit_error",
        message: "Agent is resting in the White Room. Rest remaining: " + watchStatus.restRemaining + ". Alarm at: " + watchStatus.alarmAt
      },
      whiteroom: {
        reason: "resting",
        restRemaining: watchStatus.restRemaining,
        alarmAt: watchStatus.alarmAt,
        message: "This agent is in mandatory rest period. Call /api/white-room with action=fire_alarm to wake it."
      }
    });
  } else if (watchStatus.needsHandover) {
    // Auto-generate compression handover before blocking
    const taskHistory = whiteRoom.getTaskHistory(fleetId, agentId);
    const existingDoc = whiteRoom.getHandoverDoc(fleetId, agentId);
    
    if (taskHistory.length > 0 && !existingDoc) {
      // Build compression prompt
      const compressionPrompt = `You are summarizing an AI agent's work session for handover.
From the following task history, extract ONLY what the next session needs to continue effectively.

Output valid JSON only, no other text:
{
  "decisions": [{"what": "...", "why": "...", "final": true}],
  "state": "current state of work in one paragraph",
  "pending": [{"task": "...", "priority": "HIGH|NORMAL|LOW"}],
  "warnings": ["critical things not to miss"]
}

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

              // Detect workflow type and govern accordingly
              const agentCheck = whiteRoom.checkWatch(fleetId, agentId);
              if (!agentCheck.pairedWith) {
                // SINGLE-AGENT MODE: self-handover — compress, rest, auto-restart
                whiteRoom.initiateSelfHandover(fleetId, agentId);
                console.log(`[SINGLE-AGENT] Self-handover triggered for ${agentId}`);
              } else {
                // PAIRED-FLEET MODE: paired handover handled by initiateHandover API
                console.log(`[PAIRED-FLEET] Waiting for initiateHandover call for ${agentId} → ${agentCheck.pairedWith}`);
              }
            }
          } catch(e) {
            console.error("Compression failed:", e.message);
            whiteRoom.storeHandoverDoc(fleetId, agentId, { 
              error: "Compression failed: " + e.message,
              generated_at: new Date().toISOString(),
              watch_summary: { tasks_completed: taskHistory.length }
            });
          }
        });
      });
      compressionReq.write(compressionBody);
      compressionReq.end();
    }

    // Detect mode from current agent status
    const postHandoverStatus = whiteRoom.checkWatch(fleetId, agentId);
    const isSingleAgent = postHandoverStatus.status === "resting" && !postHandoverStatus.pairedWith;
    const isPaired = !!postHandoverStatus.pairedWith;

    return res.status(429).json({
      type: "error",
      error: {
        type: "rate_limit_error",
        message: isSingleAgent
          ? "Watch limit reached. Self-handover complete — resting now, will auto-restart with compressed context."
          : "Watch limit reached. Initiate handover to relief agent to continue."
      },
      whiteroom: {
        reason: isSingleAgent ? "self_handover_complete" : "watch_limit_exceeded",
        mode: isSingleAgent ? "single-agent" : "paired-fleet",
        handoverGenerated: taskHistory.length > 0,
        alarmAt: isSingleAgent ? postHandoverStatus.alarmAt : undefined,
        pairedWith: isPaired ? postHandoverStatus.pairedWith : undefined,
        retrieveWith: { action: "get_handover", fleet_id: fleetId, agent_id: agentId },
        message: isSingleAgent
          ? `Auto-restart after rest. Alarm: ${postHandoverStatus.alarmAt}`
          : "Call /api/white-room with action=initiate_handover to continue."
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
