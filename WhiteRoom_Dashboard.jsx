import { useState, useEffect, useCallback } from "react";

const WATCH_TICKS = 72;
const REST_TICKS = 72;
const COST_PER_1K = 0.003;
const ENERGY_PER_1M = 0.4;

const PAIRS = [
  { a: { id: "alpha", role: "Researcher", emoji: "🔍", color: "#3b82f6" }, b: { id: "bravo", role: "Researcher (Relief)", emoji: "🔎", color: "#6366f1" } },
  { a: { id: "charlie", role: "Writer", emoji: "✍️", color: "#8b5cf6" }, b: { id: "delta", role: "Writer (Relief)", emoji: "📝", color: "#a78bfa" } },
];

const TASKS = [
  { name: "Deep research", tokens: 2800, priority: "HIGH" },
  { name: "Source analysis", tokens: 1900, priority: "NORMAL" },
  { name: "Draft section", tokens: 3200, priority: "HIGH" },
  { name: "Review content", tokens: 1200, priority: "NORMAL" },
  { name: "Safety check", tokens: 800, priority: "CRITICAL" },
  { name: "Edit prose", tokens: 2100, priority: "NORMAL" },
  { name: "Fact check", tokens: 1500, priority: "HIGH" },
  { name: "Synthesize", tokens: 2600, priority: "NORMAL" },
];

function mkAgent(cfg, active) {
  return { ...cfg, status: active ? "working" : "resting", watchTick: 0, restTick: active ? 0 : REST_TICKS, watchNum: active ? 1 : 0, tasks: 0, ctx: 0, sent: 0, sentNoRest: 0, otCredits: 0, handovers: 0, alarms: 0, recent: [], ctxHist: [] };
}

export default function WhiteRoomDashboard() {
  const [agents, setAgents] = useState(() => { const a = []; PAIRS.forEach(p => { a.push(mkAgent(p.a, true)); a.push(mkAgent(p.b, false)); }); return a; });
  const [log, setLog] = useState([]);
  const [on, setOn] = useState(false);
  const [spd, setSpd] = useState(1);
  const [tk, setTk] = useState(0);
  const [sel, setSel] = useState(null);

  const addLog = useCallback((m, t = "info") => { setLog(p => [{ id: Date.now() + Math.random(), m, t }, ...p.slice(0, 59)]); }, []);

  const partner = (id) => { for (const p of PAIRS) { if (p.a.id === id) return p.b.id; if (p.b.id === id) return p.a.id; } return null; };

  const sim = useCallback(() => {
    setTk(t => t + 1);
    setAgents(prev => {
      const nx = prev.map(a => ({ ...a, recent: [...a.recent], ctxHist: [...a.ctxHist] }));
      nx.forEach(a => {
        if (a.status === "resting") { a.restTick += 1; if (a.restTick >= REST_TICKS) { a.status = "alarm"; a.alarms += 1; addLog(`⏰ ${a.emoji} ${a.role} alarm! Ready for handover.`, "alarm"); } return; }
        if (a.status === "alarm" || a.status === "handing_over") return;
        if (a.status === "working" || a.status === "overtime") {
          const task = TASKS[Math.floor(Math.random() * TASKS.length)];
          a.ctx += task.tokens;
          a.sent += a.ctx;
          a.sentNoRest += a.ctx;
          a.tasks += 1;
          a.watchTick += 1;
          a.recent = [...a.recent.slice(-7), { ...task, c: a.ctx }];
          a.ctxHist.push({ tokens: a.ctx });
          if (a.watchTick > WATCH_TICKS && a.status !== "overtime") { a.status = "overtime"; addLog(`⚠️ ${a.emoji} ${a.role} OVERTIME`, "overtime"); }
          if (a.watchTick > WATCH_TICKS) { const pm = task.priority === "CRITICAL" ? 2 : task.priority === "HIGH" ? 1.5 : 1; a.otCredits += 30 * 1.5 * pm; }
          if (a.watchTick >= WATCH_TICKS) {
            const pid = partner(a.id); const pr = nx.find(x => x.id === pid);
            if (pr && (pr.status === "alarm" || (pr.status === "resting" && pr.restTick >= REST_TICKS - 2))) {
              const before = a.ctx;
              a.status = "handing_over"; a.handovers += 1;
              pr.status = "working"; pr.watchTick = 0; pr.watchNum += 1; pr.ctx = Math.min(2000, Math.floor(before * 0.05)); pr.handovers += 1; pr.ctxHist.push({ tokens: pr.ctx });
              addLog(`🔄 HANDOVER ${a.emoji}→${pr.emoji} | ${(before/1000).toFixed(1)}K → ${(pr.ctx/1000).toFixed(1)}K context (${((1-pr.ctx/before)*100).toFixed(0)}% cut)`, "handover");
              setTimeout(() => { setAgents(p => p.map(x => x.id === a.id ? { ...x, status: "resting", restTick: 0, ctx: 0, ctxHist: [...x.ctxHist, { tokens: 0 }] } : x)); addLog(`😴 ${a.emoji} ${a.role} → White Room. Context cleared.`, "rest"); }, 100);
            }
          }
        }
      });
      return nx;
    });
  }, [addLog]);

  useEffect(() => { if (!on) return; const iv = setInterval(sim, 1200 / spd); return () => clearInterval(iv); }, [on, spd, sim]);

  const reset = () => { const a = []; PAIRS.forEach(p => { a.push(mkAgent(p.a, true)); a.push(mkAgent(p.b, false)); }); setAgents(a); setLog([]); setTk(0); setOn(false); setSel(null); };

  const tSent = agents.reduce((s, a) => s + a.sent, 0);
  const tNoRest = agents.reduce((s, a) => s + a.sentNoRest, 0);
  const savePct = tNoRest > 0 ? ((1 - tSent / tNoRest) * 100) : 0;
  const cost = (tSent / 1000) * COST_PER_1K;
  const costNR = (tNoRest / 1000) * COST_PER_1K;
  const energy = (tSent / 1000000) * ENERGY_PER_1M;
  const energyNR = (tNoRest / 1000000) * ENERGY_PER_1M;

  const sc = s => ({ working: { bg: "#052e16", bd: "#22c55e", tx: "#4ade80" }, overtime: { bg: "#451a03", bd: "#f59e0b", tx: "#fbbf24" }, handing_over: { bg: "#1e1b4b", bd: "#818cf8", tx: "#a5b4fc" }, resting: { bg: "#0c4a6e", bd: "#0ea5e9", tx: "#38bdf8" }, alarm: { bg: "#4c0519", bd: "#f43f5e", tx: "#fb7185" } }[s] || { bg: "#1e293b", bd: "#475569", tx: "#94a3b8" });

  return (
    <div style={{ minHeight: "100vh", background: "#050810", color: "#e2e8f0", fontFamily: "'SF Mono','JetBrains Mono',monospace", fontSize: 12 }}>
      <div style={{ background: "#0a0f1a", borderBottom: "1px solid #1e293b", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: on ? "#22c55e" : "#475569", boxShadow: on ? "0 0 12px #22c55e" : "none" }} />
          <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: 3 }}>WHITE ROOM</span>
          <span style={{ fontSize: 9, color: "#475569", borderLeft: "1px solid #334155", paddingLeft: 10 }}>6h ON / 5min HANDOVER / 6h REST</span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 9, color: "#64748b" }}>Sim: {((tk * 30) / 60).toFixed(1)}h</span>
          <button onClick={() => setOn(!on)} style={{ background: on ? "#991b1b" : "#166534", color: "#fff", border: "none", borderRadius: 5, padding: "5px 14px", fontSize: 11, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>{on ? "■ STOP" : "▶ RUN"}</button>
          <select value={spd} onChange={e => setSpd(Number(e.target.value))} style={{ background: "#1e293b", color: "#e2e8f0", border: "1px solid #334155", borderRadius: 5, padding: "5px 8px", fontSize: 11, fontFamily: "inherit" }}>
            <option value={0.5}>0.5x</option><option value={1}>1x</option><option value={2}>2x</option><option value={4}>4x</option>
          </select>
          <button onClick={reset} style={{ background: "transparent", color: "#64748b", border: "1px solid #334155", borderRadius: 5, padding: "5px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Reset</button>
        </div>
      </div>

      {/* Savings Banner */}
      <div style={{ background: "linear-gradient(90deg,#052e16 0%,#0a0f1a 50%,#0c4a6e 100%)", padding: "10px 20px", display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1 }}>
        {[
          { l: "TOKENS SENT", v: `${(tSent/1000).toFixed(0)}K`, c: "#f8fafc" },
          { l: "WITHOUT REST", v: `${(tNoRest/1000).toFixed(0)}K`, c: "#ef4444" },
          { l: "REDUCTION", v: `${savePct.toFixed(0)}%`, c: "#4ade80" },
          { l: "COST", v: `$${cost.toFixed(3)}`, c: "#f8fafc" },
          { l: "COST SAVED", v: `$${(costNR-cost).toFixed(3)}`, c: "#4ade80" },
          { l: "ENERGY", v: `${energy.toFixed(4)} kWh`, c: "#38bdf8" },
          { l: "ENERGY SAVED", v: `${(energyNR-energy).toFixed(4)} kWh`, c: "#4ade80" },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: "center", padding: "4px 0" }}>
            <div style={{ fontSize: 7, color: "#64748b", letterSpacing: 1.5 }}>{s.l}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", minHeight: "calc(100vh - 130px)" }}>
        <div style={{ padding: "12px 16px", overflowY: "auto" }}>
          {PAIRS.map((pair, pi) => {
            const a = agents.find(x => x.id === pair.a.id), b = agents.find(x => x.id === pair.b.id);
            return (
              <div key={pi} style={{ marginBottom: 12, background: "#0a0f1a", border: "1px solid #1e293b", borderRadius: 8, overflow: "hidden" }}>
                <div style={{ padding: "6px 12px", background: "#0f172a", borderBottom: "1px solid #1e293b", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", letterSpacing: 1 }}>WATCH PAIR {pi + 1}</span>
                  <span style={{ fontSize: 8, color: "#475569" }}>Handovers: {a.handovers + b.handovers}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "#1e293b" }}>
                  {[a, b].map(ag => {
                    const s = sc(ag.status), prog = (ag.status === "resting" || ag.status === "alarm") ? ag.restTick / REST_TICKS : ag.watchTick / WATCH_TICKS;
                    return (
                      <div key={ag.id} onClick={() => setSel(sel === ag.id ? null : ag.id)} style={{ background: "#0a0f1a", padding: "10px 12px", cursor: "pointer", borderLeft: `3px solid ${s.bd}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 16 }}>{ag.emoji}</span>
                            <div><div style={{ fontSize: 10, fontWeight: 700 }}>{ag.role}</div><div style={{ fontSize: 7, color: "#475569" }}>Watch #{ag.watchNum} | {ag.tasks} tasks</div></div>
                          </div>
                          <div style={{ fontSize: 7, fontWeight: 700, padding: "2px 6px", borderRadius: 6, background: s.bg, color: s.tx, border: `1px solid ${s.bd}`, letterSpacing: 1, textTransform: "uppercase" }}>{ag.status === "handing_over" ? "HANDOVER" : ag.status}</div>
                        </div>
                        <div style={{ marginBottom: 5 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 7, color: "#475569", marginBottom: 2 }}>
                            <span>{ag.status === "resting" || ag.status === "alarm" ? "Rest" : "Watch"}</span><span>{(prog * 100).toFixed(0)}%</span>
                          </div>
                          <div style={{ height: 3, background: "#1e293b", borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ height: "100%", borderRadius: 2, width: `${Math.min(prog * 100, 100)}%`, background: s.bd, transition: "width 0.3s" }} />
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 3 }}>
                          {[{ l: "CONTEXT", v: `${(ag.ctx / 1000).toFixed(1)}K`, c: ag.ctx > 30000 ? "#f59e0b" : "#e2e8f0" }, { l: "OT CREDITS", v: ag.otCredits.toFixed(0) }, { l: "SENT", v: `${(ag.sent / 1000).toFixed(0)}K` }].map((x, i) => (
                            <div key={i} style={{ background: "#050810", borderRadius: 3, padding: "2px 4px", textAlign: "center" }}>
                              <div style={{ fontSize: 6, color: "#475569" }}>{x.l}</div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: x.c || "#e2e8f0" }}>{x.v}</div>
                            </div>
                          ))}
                        </div>
                        {sel === ag.id && ag.ctxHist.length > 0 && (
                          <div style={{ marginTop: 6, borderTop: "1px solid #1e293b", paddingTop: 6 }}>
                            <div style={{ fontSize: 7, color: "#64748b", letterSpacing: 1, marginBottom: 3 }}>CONTEXT SIZE OVER TIME</div>
                            <div style={{ display: "flex", alignItems: "flex-end", gap: 1, height: 32 }}>
                              {ag.ctxHist.slice(-30).map((h, i) => {
                                const mx = Math.max(...ag.ctxHist.slice(-30).map(x => x.tokens), 1);
                                return <div key={i} style={{ flex: 1, height: Math.max(1, (h.tokens / mx) * 30), background: h.tokens === 0 ? "#22c55e" : h.tokens > 30000 ? "#f59e0b" : "#3b82f6", borderRadius: "1px 1px 0 0" }} />;
                              })}
                            </div>
                            <div style={{ fontSize: 7, color: "#334155", marginTop: 2 }}>Green bars = context cleared at handover</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <div style={{ background: "#0a0f1a", border: "1px solid #1e293b", borderRadius: 8, padding: "10px 14px" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", letterSpacing: 1, marginBottom: 8 }}>CONTINUOUS vs WHITE ROOM</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ background: "#1c0f0f", border: "1px solid #7f1d1d", borderRadius: 6, padding: "8px 10px" }}>
                <div style={{ fontSize: 7, color: "#ef4444", marginBottom: 2 }}>WITHOUT REST</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#fca5a5" }}>{(tNoRest / 1000).toFixed(0)}K tokens</div>
                <div style={{ fontSize: 8, color: "#ef4444" }}>${costNR.toFixed(3)} | {energyNR.toFixed(4)} kWh</div>
                <div style={{ fontSize: 7, color: "#7f1d1d", marginTop: 2 }}>Context grows forever. Every call pays full cost.</div>
              </div>
              <div style={{ background: "#052e16", border: "1px solid #166534", borderRadius: 6, padding: "8px 10px" }}>
                <div style={{ fontSize: 7, color: "#4ade80", marginBottom: 2 }}>WITH WHITE ROOM</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#86efac" }}>{(tSent / 1000).toFixed(0)}K tokens</div>
                <div style={{ fontSize: 8, color: "#4ade80" }}>${cost.toFixed(3)} | {energy.toFixed(4)} kWh</div>
                <div style={{ fontSize: 7, color: "#166534", marginTop: 2 }}>Context resets at handover. Fresh agent, lower cost.</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ borderLeft: "1px solid #1e293b", background: "#050810", padding: "10px", overflowY: "auto" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", letterSpacing: 1, marginBottom: 8 }}>AUDIT LOG</div>
          {log.length === 0 && <div style={{ fontSize: 10, color: "#334155", textAlign: "center", marginTop: 40 }}>Press RUN to start</div>}
          {log.map(e => (
            <div key={e.id} style={{ marginBottom: 3, padding: "4px 6px", background: "#0a0f1a", borderRadius: 3, borderLeft: `2px solid ${{ handover: "#818cf8", overtime: "#f59e0b", rest: "#0ea5e9", alarm: "#f43f5e" }[e.t] || "#334155"}` }}>
              <div style={{ fontSize: 9, color: "#cbd5e1", lineHeight: 1.3 }}>{e.m}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ borderTop: "1px solid #1e293b", padding: "5px 20px", display: "flex", justifyContent: "space-between", fontSize: 7, color: "#334155", background: "#050810" }}>
        <span>White Room v0.2 | 6h Watch / 5min Handover / 6h Rest</span>
        <span>Context clearing reduces compute cost and energy consumption</span>
      </div>
    </div>
  );
}
