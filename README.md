# White Room — Join39 Agent Store App

**Work/Rest Governance Layer for AI Agents**

A maritime-inspired middleware that enforces labor scheduling for AI agents: 6-hour watch cycles, 5-minute handovers, 6-hour mandatory rest, and alarm-based wake-ups. Built for the [Join39](https://join39.org) Agent Store.

## Why

AI agents run continuously without resource governance. No shift limits, no context clearing, no audit trail. The result: context window bloat, compounding errors, unbounded API costs.

White Room fixes this with three mechanisms:
1. **Watch Cycles**: 6h on / 6h off, inspired by maritime watch schedules (MLC 2006, STCW)
2. **Handovers**: Structured context transfer between agent pairs — what was done, what's pending, key findings
3. **Energy Savings**: Context reset at handover reduces tokens from ~40K to ~2K per call

## How It Works

```
User → Join39 Agent → Installs White Room → Calls governance actions
                                              ↓
                                    register_agent → pair_agents → start_watch
                                              ↓
                                    complete_task → check_watch → initiate_handover
                                              ↓
                                    Agent enters White Room (rest) → alarm fires → repeat
```

## Local Setup

```bash
git clone https://github.com/nyari769mit/white-room-join39.git
cd white-room-join39
npm install
node server.js        # Port 3000
```

Test:
```bash
node test.js          # 15 tests
```

## Deploy to Render

1. Push to GitHub
2. Render → New → Web Service → Connect repo
3. Build: `npm install` | Start: `node server.js` | Free tier
4. Note URL (e.g., `https://white-room.onrender.com`)

## Submit to Join39

Go to [join39.org/apps/submit](https://join39.org/apps/submit):
- **Name**: `white-room`
- **Display Name**: White Room
- **Category**: utilities
- **API Endpoint**: `https://white-room.onrender.com/api/white-room`
- **Method**: POST
- **Auth**: none
- **Parameters**: copy from `join39-manifest.json`

## API Actions

| Action | Description |
|--------|-------------|
| `register_agent` | Add an agent to the fleet |
| `pair_agents` | Pair two agents for watch rotation |
| `start_watch` | Begin a 6-hour shift |
| `complete_task` | Log finished work with time and tokens |
| `check_watch` | Check remaining shift time |
| `initiate_handover` | Transfer context to relief agent |
| `fire_alarm` | Wake a resting agent |
| `fleet_report` | Get fleet status and energy savings |

---

*Built by Nyari Nain | MIT Sloan SFMBA '26 | Artory.AI*
*Inspired by maritime labor law (MLC 2006, STCW Convention)*
*Course: 15.S12 — Agentic Web*
