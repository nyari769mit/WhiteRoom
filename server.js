const express = require("express");
const whiteRoom = require("./engine");

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ─── Health Check ───────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", app: "white-room", version: "1.0.0" });
});

app.get("/", (req, res) => {
  res.json({
    app: "White Room",
    version: "1.0.0",
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

    switch (action) {
      case "register_agent": {
        if (!agent_id) return res.status(400).json({ error: "agent_id is required." });
        const result = whiteRoom.registerAgent(fleetId, agent_id, agent_role || "worker");
        return res.json(result);
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
app.listen(PORT, () => {
  console.log(`White Room running on port ${PORT}`);
});
