# White Room

**A Work/Rest Governance Layer for AI Agents**

White Room applies labor economics principles to AI agent orchestration. It tracks agent work sessions, enforces rest periods, manages overtime credits, and produces audit logs. Inspired by maritime labor regulations (MLC, STCW conventions).

## Why

AI agents in production run continuously without resource governance. No shift limits, no mandatory context clearing, no workload-based resource allocation. The result: context window bloat, compounding errors, unbounded API costs, and no audit trail.

White Room fixes this with three mechanisms:

1. **Work/Rest Scheduling**: Mandatory context clearing after configurable activity windows
2. **Overtime Credits**: Agents exceeding shift limits earn 1.5x credits, redeemable as extended rest or extra token budget
3. **Compensation Scaling**: Higher-priority tasks earn proportionally more credits

## Quick Start

```python
from src.tracker import WhiteRoom, TaskPriority

# Create a fleet
wr = WhiteRoom("story-crew")

# Register agents with different shift limits
researcher = wr.register_agent("researcher", role="Researcher", max_work_minutes=60, rest_minutes=15)
writer = wr.register_agent("writer", role="Writer", max_work_minutes=45, rest_minutes=20)

# Start working
researcher.start_shift()
researcher.complete_task("theme_research", minutes=25, tokens_used=1200)
researcher.complete_task("source_analysis", minutes=20, tokens_used=1800)
researcher.take_rest()  # Context cleared, ready for next shift

# Writer goes into overtime
writer.start_shift()
writer.complete_task("draft", minutes=30, tokens_used=2000)
writer.complete_task("revision", minutes=20, tokens_used=1500)
# Writer is now in overtime: 50min > 45min limit
# Earned 7.5 overtime credits (5min * 1.5x)
writer.take_rest()  # Gets 27.5min rest (20 base + 7.5 bonus)

# Fleet report
report = wr.get_fleet_report()
print(f"Overworked agents: {wr.get_overworked_agents()}")
print(f"Available agents: {wr.get_idle_agents()}")
```

## Features

- **Shift management**: Start/end shifts, auto-start on task completion
- **Overtime tracking**: Configurable limits with 1.5x credit accrual
- **Priority scaling**: CRITICAL (2x) and HIGH (1.5x) tasks earn more credits
- **Forced rest**: Hard overtime cap triggers mandatory rest
- **Token budgets**: Per-shift token limits with exceeded warnings
- **Credit redemption**: Use credits for rest, token budget, or priority boosts
- **Audit logging**: Full trail of shifts, tasks, and governance decisions
- **Callbacks**: Hook into overtime and forced-rest events
- **Fleet management**: WhiteRoom class manages multiple agents
- **JSON export**: Serialize reports for dashboards and APIs

## Testing

```bash
python3 tests/test_tracker.py
```

12 tests covering: basic shifts, overtime, forced rest, priority compensation, token budgets, credit redemption, auto-start, audit logs, fleet management, multiple shifts, JSON export, and callbacks.

## Dashboard

The React dashboard (`WhiteRoom_Dashboard.jsx`) provides a real-time simulation showing:
- Agent status cards with shift progress bars
- Fleet summary (work/rest/tokens/credits/energy saved)
- Labor compliance percentages
- Live audit log with color-coded events

## Architecture

```
Agent Runtime (CrewAI / LangGraph / Join39)
    |
    v
White Room Middleware
    - AgentWorkTracker (per agent)
    - WhiteRoom (fleet manager)
    |
    v
Dashboard / API / Audit Log
```

## Project Structure

```
white-room/
  src/
    __init__.py
    tracker.py          # Core: AgentWorkTracker + WhiteRoom
  tests/
    test_tracker.py     # 12 unit tests
  dashboard/
    WhiteRoom_Dashboard.jsx  # React dashboard
  README.md
```

---

*Built by Nyari Nain | MIT Sloan | Artory.AI*
*Inspired by maritime labor law (MLC 2006, STCW Convention)*
