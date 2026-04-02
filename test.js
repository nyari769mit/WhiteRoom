/**
 * White Room API Tests
 * Run: node test.js (with server running on port 3000)
 */

const BASE = "http://localhost:3000";
let passed = 0;
let failed = 0;

async function call(action, params = {}) {
  const res = await fetch(`${BASE}/api/white-room`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, fleet_id: "test-fleet", ...params })
  });
  return res.json();
}

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (err) {
    failed++;
    console.log(`  ❌ ${name}: ${err.message}`);
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}

async function run() {
  console.log("\n🔧 White Room API Tests\n");

  // Health check
  const health = await fetch(`${BASE}/health`).then(r => r.json());
  await test("Health endpoint", () => {
    assert(health.status === "ok", "Expected status ok");
    assert(health.app === "white-room", "Expected app white-room");
  });

  // Register agents
  await test("Register agent alpha", async () => {
    const res = await call("register_agent", { agent_id: "alpha", agent_role: "researcher" });
    assert(res.success === true, "Expected success");
  });

  await test("Register agent bravo", async () => {
    const res = await call("register_agent", { agent_id: "bravo", agent_role: "researcher" });
    assert(res.success === true, "Expected success");
  });

  await test("Duplicate registration fails", async () => {
    const res = await call("register_agent", { agent_id: "alpha" });
    assert(res.error, "Expected error for duplicate");
  });

  // Pair agents
  await test("Pair alpha + bravo", async () => {
    const res = await call("pair_agents", { agent_id: "alpha", paired_with: "bravo" });
    assert(res.success === true, "Expected success");
  });

  // Start watch
  await test("Start alpha's watch", async () => {
    const res = await call("start_watch", { agent_id: "alpha" });
    assert(res.success === true, "Expected success");
    assert(res.watchNumber === 1, "Expected watch 1");
  });

  await test("Can't start watch while already working", async () => {
    const res = await call("start_watch", { agent_id: "alpha" });
    assert(res.error, "Expected error for double start");
  });

  // Complete tasks
  await test("Complete a task", async () => {
    const res = await call("complete_task", {
      agent_id: "alpha", task_name: "research_topic", minutes_spent: 120, tokens_used: 15000
    });
    assert(res.success === true, "Expected success");
    assert(res.watchProgress.minutesRemaining === 240, "Expected 240 min remaining");
  });

  await test("Watch limit triggers handover alert", async () => {
    const res = await call("complete_task", {
      agent_id: "alpha", task_name: "deep_analysis", minutes_spent: 300, tokens_used: 45000
    });
    assert(res.alert === "WATCH_LIMIT_REACHED", "Expected watch limit alert");
    assert(res.reliefAgent === "bravo", "Expected bravo as relief");
  });

  // Check watch
  await test("Check watch status", async () => {
    const res = await call("check_watch", { agent_id: "alpha" });
    assert(res.needsHandover === true, "Expected needs handover");
  });

  // Initiate handover
  await test("Handover from alpha to bravo", async () => {
    const res = await call("initiate_handover", {
      agent_id: "alpha",
      to_agent: "bravo",
      context_summary: "Completed research and analysis phases."
    });
    assert(res.success === true, "Expected success");
    assert(res.outgoingAgent.status === "resting", "Alpha should be resting");
    assert(res.incomingAgent.status === "working", "Bravo should be working");
    assert(res.energySavings, "Expected energy savings data");
  });

  // Check resting agent
  await test("Alpha is in White Room", async () => {
    const res = await call("check_watch", { agent_id: "alpha" });
    assert(res.status === "resting", "Expected resting");
    assert(res.alarmAt, "Expected alarm time");
  });

  // Fire alarm
  await test("Fire alarm to wake alpha", async () => {
    const res = await call("fire_alarm", { agent_id: "alpha" });
    assert(res.success === true, "Expected success");
    assert(res.status === "idle", "Expected idle after alarm");
  });

  // Fleet report
  await test("Fleet report", async () => {
    const res = await call("fleet_report");
    assert(res.agentCount === 2, "Expected 2 agents");
    assert(res.totals.handovers >= 1, "Expected at least 1 handover");
    assert(res.energySavings, "Expected energy savings");
  });

  // Invalid action
  await test("Invalid action returns error", async () => {
    const res = await call("invalid_action");
    assert(res.error, "Expected error for invalid action");
  });

  console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
