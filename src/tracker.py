"""
White Room - Work/Rest Governance Layer for AI Agents
=====================================================
Core module v0.2: Watch Cycles, Handover, and Alarms

6 hours on / 5 min handover / 6 hours White Room / 5 min handover / repeat

Inspired by maritime watch schedules (MLC 2006, STCW Convention).

Usage:
    from tracker import WhiteRoom

    wr = WhiteRoom("story-crew")
    wr.register_agent("alpha", role="Researcher")
    wr.register_agent("bravo", role="Researcher")  # Relief agent
    wr.pair_agents("alpha", "bravo")  # They share the watch

    wr.start_watch("alpha")
    wr.complete_task("alpha", "research", minutes=120, tokens_used=5000)
    # ... after 6 hours ...
    wr.initiate_handover("alpha", "bravo")  # 5-min handover
    # alpha enters White Room, bravo starts working
"""

import uuid
import json
from datetime import datetime, timedelta
from enum import Enum
from dataclasses import dataclass, field
from typing import Optional, Callable
from copy import deepcopy


# ─── Enums ───────────────────────────────────────────────────────────────

class AgentStatus(Enum):
    IDLE = "idle"
    WORKING = "working"
    OVERTIME = "overtime"
    HANDOVER_OUT = "handing_over"    # Outgoing: briefing the relief
    HANDOVER_IN = "receiving"        # Incoming: being briefed
    RESTING = "resting"              # In the White Room
    BLOCKED = "blocked"              # Hard cap hit, forced rest
    ALARM = "alarm"                  # Wake-up alarm fired, preparing to return


class TaskPriority(Enum):
    LOW = 1
    NORMAL = 2
    HIGH = 3
    CRITICAL = 4


# ─── Data Records ───────────────────────────────────────────────────────

@dataclass
class TaskRecord:
    task_id: str
    task_name: str
    minutes_spent: float
    tokens_used: int
    priority: TaskPriority
    completed_at: str
    was_overtime: bool
    error_count: int = 0


@dataclass
class HandoverRecord:
    handover_id: str
    from_agent: str
    to_agent: str
    started_at: str
    completed_at: Optional[str] = None
    duration_minutes: float = 5.0
    context_summary: str = ""
    pending_tasks: list = field(default_factory=list)
    warnings: list = field(default_factory=list)
    key_findings: list = field(default_factory=list)
    tokens_in_context: int = 0
    status: str = "in_progress"  # in_progress, completed, failed


@dataclass
class WatchRecord:
    """A single watch (shift) record."""
    watch_id: str
    watch_number: int
    agent_id: str
    started_at: str
    ended_at: Optional[str] = None
    tasks: list = field(default_factory=list)
    total_work_minutes: float = 0
    total_tokens: int = 0
    overtime_minutes: float = 0
    overtime_credits_earned: float = 0
    handover_out: Optional[str] = None  # handover_id
    handover_in: Optional[str] = None   # handover_id


@dataclass
class AlarmRecord:
    alarm_id: str
    agent_id: str
    scheduled_at: str
    fired_at: Optional[str] = None
    acknowledged: bool = False
    watch_number: int = 0


# ─── Agent Work Tracker ─────────────────────────────────────────────────

class AgentWorkTracker:
    """
    Tracks and governs a single AI agent's watch cycle.

    Default: 6 hours on, 6 hours off, 5 minutes handover.
    All times stored in minutes internally.
    """

    HOURS_TO_MINUTES = 60

    def __init__(
        self,
        agent_id: str,
        role: str = "agent",
        watch_hours: float = 6,
        rest_hours: float = 6,
        handover_minutes: float = 5,
        overtime_rate: float = 1.5,
        max_overtime_minutes: float = 60,
        token_budget: Optional[int] = None,
        on_overtime: Optional[Callable] = None,
        on_forced_rest: Optional[Callable] = None,
        on_alarm: Optional[Callable] = None,
    ):
        self.agent_id = agent_id
        self.role = role
        self.watch_minutes = watch_hours * self.HOURS_TO_MINUTES
        self.rest_minutes = rest_hours * self.HOURS_TO_MINUTES
        self.handover_minutes = handover_minutes
        self.overtime_rate = overtime_rate
        self.max_overtime_minutes = max_overtime_minutes
        self.token_budget = token_budget
        self.on_overtime = on_overtime
        self.on_forced_rest = on_forced_rest
        self.on_alarm = on_alarm

        # Paired relief agent
        self.relief_agent_id: Optional[str] = None

        # State
        self.status = AgentStatus.IDLE
        self.current_watch: Optional[WatchRecord] = None
        self.watch_history: list[WatchRecord] = []
        self.handover_history: list[HandoverRecord] = []
        self.alarm_history: list[AlarmRecord] = []
        self.overtime_credits: float = 0.0
        self.total_watches: int = 0
        self.total_tasks: int = 0
        self.total_work_minutes: float = 0
        self.total_rest_minutes: float = 0
        self.total_tokens_used: int = 0
        self.total_overtime_minutes: float = 0
        self.total_handover_minutes: float = 0
        self.error_log: list[dict] = []
        self.created_at = datetime.now().isoformat()

        # Current context (what gets handed over)
        self.working_context: dict = {
            "pending_tasks": [],
            "key_findings": [],
            "warnings": [],
            "tokens_in_context": 0,
            "last_task": None,
            "notes": "",
        }

    # ─── Watch (Shift) Management ────────────────────────────────────

    def start_watch(self, handover_context: Optional[dict] = None) -> dict:
        """Begin a new watch period. Optionally receive handover context."""
        if self.status == AgentStatus.BLOCKED:
            return {"success": False, "error": "Agent is blocked. Must complete rest."}

        if self.status == AgentStatus.WORKING:
            return {"success": False, "error": "Watch already in progress.", "watch_id": self.current_watch.watch_id}

        self.total_watches += 1
        self.status = AgentStatus.WORKING

        self.current_watch = WatchRecord(
            watch_id=str(uuid.uuid4())[:8],
            watch_number=self.total_watches,
            agent_id=self.agent_id,
            started_at=datetime.now().isoformat(),
        )

        # Absorb handover context if provided
        if handover_context:
            self.working_context = {
                "pending_tasks": handover_context.get("pending_tasks", []),
                "key_findings": handover_context.get("key_findings", []),
                "warnings": handover_context.get("warnings", []),
                "tokens_in_context": handover_context.get("tokens_in_context", 0),
                "last_task": handover_context.get("last_task"),
                "notes": handover_context.get("notes", ""),
            }

        return {
            "success": True,
            "watch_id": self.current_watch.watch_id,
            "watch_number": self.total_watches,
            "watch_duration": f"{self.watch_minutes / 60:.0f}h",
            "received_context": handover_context is not None,
            "pending_tasks": len(self.working_context["pending_tasks"]),
        }

    def end_watch(self) -> dict:
        """End the current watch."""
        if not self.current_watch:
            return {"success": False, "error": "No active watch."}

        self.current_watch.ended_at = datetime.now().isoformat()
        self.watch_history.append(self.current_watch)

        result = {
            "success": True,
            "watch_id": self.current_watch.watch_id,
            "total_work_minutes": self.current_watch.total_work_minutes,
            "total_tokens": self.current_watch.total_tokens,
            "tasks_completed": len(self.current_watch.tasks),
            "overtime_minutes": self.current_watch.overtime_minutes,
            "overtime_credits_earned": self.current_watch.overtime_credits_earned,
        }

        self.current_watch = None
        return result

    # ─── Task Tracking ───────────────────────────────────────────────

    def complete_task(
        self,
        task_name: str,
        minutes: float,
        tokens_used: int = 0,
        priority: TaskPriority = TaskPriority.NORMAL,
        error_count: int = 0,
    ) -> dict:
        """Log a completed task. Checks overtime and triggers warnings."""
        if self.status in (AgentStatus.BLOCKED, AgentStatus.RESTING, AgentStatus.HANDOVER_OUT):
            return {"success": False, "error": f"Agent is {self.status.value}. Cannot work."}

        if self.status == AgentStatus.IDLE:
            self.start_watch()

        if not self.current_watch:
            return {"success": False, "error": "No active watch."}

        task = TaskRecord(
            task_id=str(uuid.uuid4())[:8],
            task_name=task_name,
            minutes_spent=minutes,
            tokens_used=tokens_used,
            priority=priority,
            completed_at=datetime.now().isoformat(),
            was_overtime=self.current_watch.total_work_minutes > self.watch_minutes,
            error_count=error_count,
        )

        self.current_watch.tasks.append(task)
        self.current_watch.total_work_minutes += minutes
        self.current_watch.total_tokens += tokens_used
        self.total_tasks += 1
        self.total_work_minutes += minutes
        self.total_tokens_used += tokens_used

        # Update working context
        self.working_context["last_task"] = task_name
        self.working_context["tokens_in_context"] += tokens_used

        if error_count > 0:
            self.working_context["warnings"].append(f"{task_name}: {error_count} errors")
            self.error_log.append({"task": task_name, "errors": error_count, "time": datetime.now().isoformat()})

        result = {
            "success": True,
            "task_id": task.task_id,
            "task_name": task_name,
            "watch_work_total": self.current_watch.total_work_minutes,
            "watch_limit": self.watch_minutes,
        }

        # Check overtime
        if self.current_watch.total_work_minutes > self.watch_minutes:
            overtime = self.current_watch.total_work_minutes - self.watch_minutes
            new_ot = overtime - self.current_watch.overtime_minutes
            priority_mult = {TaskPriority.LOW: 1.0, TaskPriority.NORMAL: 1.0, TaskPriority.HIGH: 1.5, TaskPriority.CRITICAL: 2.0}[priority]
            credits = new_ot * self.overtime_rate * priority_mult

            self.current_watch.overtime_minutes = overtime
            self.current_watch.overtime_credits_earned += credits
            self.overtime_credits += credits
            self.total_overtime_minutes += new_ot
            self.status = AgentStatus.OVERTIME

            result["overtime"] = True
            result["overtime_minutes"] = overtime
            result["credits_earned"] = credits
            result["total_credits"] = self.overtime_credits
            result["needs_handover"] = True

            if self.on_overtime:
                self.on_overtime(self.agent_id, overtime, self.overtime_credits)

            if overtime >= self.max_overtime_minutes:
                result["forced_rest"] = True
                self.status = AgentStatus.BLOCKED
                if self.on_forced_rest:
                    self.on_forced_rest(self.agent_id, overtime)
        else:
            remaining = self.watch_minutes - self.current_watch.total_work_minutes
            result["overtime"] = False
            result["watch_remaining"] = remaining
            result["needs_handover"] = remaining <= self.handover_minutes

        # Token budget
        if self.token_budget and self.current_watch.total_tokens > self.token_budget:
            result["token_budget_exceeded"] = True

        return result

    # ─── Handover System ─────────────────────────────────────────────

    def prepare_handover(self, pending_tasks: list = None, notes: str = "") -> HandoverRecord:
        """
        Prepare a handover document. This is what the outgoing agent
        gives to the incoming agent during the 5-minute handover window.

        Like a maritime watch officer's handover brief:
        - What happened during my watch
        - What's still pending
        - Any warnings or issues
        - Key findings the next agent needs
        """
        if pending_tasks:
            self.working_context["pending_tasks"] = pending_tasks
        if notes:
            self.working_context["notes"] = notes

        # Build the handover document
        tasks_completed = []
        if self.current_watch:
            tasks_completed = [
                {"name": t.task_name, "minutes": t.minutes_spent, "priority": t.priority.name}
                for t in self.current_watch.tasks
            ]

        handover = HandoverRecord(
            handover_id=str(uuid.uuid4())[:8],
            from_agent=self.agent_id,
            to_agent=self.relief_agent_id or "unassigned",
            started_at=datetime.now().isoformat(),
            duration_minutes=self.handover_minutes,
            context_summary=f"Watch #{self.total_watches}: {len(tasks_completed)} tasks completed, "
                           f"{self.current_watch.total_work_minutes:.0f}min worked, "
                           f"{self.current_watch.total_tokens} tokens used."
                           if self.current_watch else "No active watch.",
            pending_tasks=self.working_context["pending_tasks"],
            warnings=self.working_context["warnings"],
            key_findings=self.working_context["key_findings"],
            tokens_in_context=self.working_context["tokens_in_context"],
        )

        self.status = AgentStatus.HANDOVER_OUT
        self.total_handover_minutes += self.handover_minutes

        return handover

    def receive_handover(self, handover: HandoverRecord) -> dict:
        """
        Receive a handover from another agent. The incoming agent
        absorbs the context and prepares to start their watch.
        """
        self.status = AgentStatus.HANDOVER_IN
        self.total_handover_minutes += self.handover_minutes

        # Absorb context
        context = {
            "pending_tasks": handover.pending_tasks,
            "key_findings": handover.key_findings,
            "warnings": handover.warnings,
            "tokens_in_context": handover.tokens_in_context,
            "last_task": None,
            "notes": handover.context_summary,
        }

        handover.completed_at = datetime.now().isoformat()
        handover.status = "completed"
        self.handover_history.append(handover)

        return {
            "success": True,
            "handover_id": handover.handover_id,
            "from_agent": handover.from_agent,
            "pending_tasks": len(handover.pending_tasks),
            "warnings": len(handover.warnings),
            "context_absorbed": True,
            "ready_to_start": True,
            "context": context,
        }

    def complete_handover_and_rest(self, handover: HandoverRecord) -> dict:
        """
        Outgoing agent completes handover and enters the White Room.
        Sets up an alarm to wake them after the rest period.
        """
        handover.completed_at = datetime.now().isoformat()
        handover.status = "completed"
        self.handover_history.append(handover)

        # End watch
        watch_summary = self.end_watch()

        # Enter the White Room
        rest_duration = self.rest_minutes
        bonus = 0
        if self.overtime_credits > 0:
            max_bonus = self.rest_minutes * 0.5  # Cap bonus at 50% of rest
            bonus = min(self.overtime_credits, max_bonus)
            rest_duration += bonus
            self.overtime_credits -= bonus

        self.total_rest_minutes += rest_duration
        self.status = AgentStatus.RESTING

        # Schedule alarm
        alarm = AlarmRecord(
            alarm_id=str(uuid.uuid4())[:8],
            agent_id=self.agent_id,
            scheduled_at=(datetime.now() + timedelta(minutes=rest_duration)).isoformat(),
            watch_number=self.total_watches + 1,
        )
        self.alarm_history.append(alarm)

        # Clear working context (the whole point of rest)
        self.working_context = {
            "pending_tasks": [],
            "key_findings": [],
            "warnings": [],
            "tokens_in_context": 0,
            "last_task": None,
            "notes": "",
        }

        return {
            "success": True,
            "entered_white_room": True,
            "rest_duration_hours": rest_duration / 60,
            "rest_base_hours": self.rest_minutes / 60,
            "overtime_bonus_minutes": bonus,
            "credits_remaining": self.overtime_credits,
            "alarm_id": alarm.alarm_id,
            "alarm_at": alarm.scheduled_at,
            "context_cleared": True,
            "watch_summary": watch_summary,
        }

    # ─── Alarm System ────────────────────────────────────────────────

    def fire_alarm(self) -> dict:
        """
        Fire the wake-up alarm. Agent transitions from resting to alarm state,
        ready to receive handover from the current working agent.
        """
        if self.status != AgentStatus.RESTING:
            return {"success": False, "error": f"Agent is {self.status.value}, not resting."}

        self.status = AgentStatus.ALARM

        # Mark alarm as fired
        for alarm in reversed(self.alarm_history):
            if not alarm.fired_at:
                alarm.fired_at = datetime.now().isoformat()
                alarm.acknowledged = True
                break

        if self.on_alarm:
            self.on_alarm(self.agent_id)

        return {
            "success": True,
            "agent_id": self.agent_id,
            "status": "alarm",
            "message": f"{self.role} alarm fired. Ready to receive handover and start watch.",
            "next_watch_number": self.total_watches + 1,
        }

    def acknowledge_alarm(self) -> dict:
        """Agent acknowledges alarm and moves to idle, ready for handover."""
        if self.status != AgentStatus.ALARM:
            return {"success": False, "error": "No alarm to acknowledge."}

        self.status = AgentStatus.IDLE
        return {
            "success": True,
            "agent_id": self.agent_id,
            "status": "idle",
            "ready_for_handover": True,
        }

    # ─── Convenience: Check Timing ───────────────────────────────────

    def needs_handover(self) -> bool:
        """Check if this agent's watch is nearly over and handover should begin."""
        if not self.current_watch:
            return False
        remaining = self.watch_minutes - self.current_watch.total_work_minutes
        return remaining <= self.handover_minutes

    def is_overdue(self) -> bool:
        """Check if agent has exceeded watch time (should have handed over)."""
        if not self.current_watch:
            return False
        return self.current_watch.total_work_minutes > self.watch_minutes

    def watch_remaining(self) -> float:
        """Minutes remaining in current watch."""
        if not self.current_watch:
            return 0
        return max(0, self.watch_minutes - self.current_watch.total_work_minutes)

    # ─── Credit Management ───────────────────────────────────────────

    def redeem_credits(self, amount: float, purpose: str = "token_budget") -> dict:
        if amount > self.overtime_credits:
            return {"success": False, "error": f"Insufficient credits. Available: {self.overtime_credits:.1f}"}
        self.overtime_credits -= amount
        return {"success": True, "redeemed": amount, "purpose": purpose, "credits_remaining": self.overtime_credits}

    # ─── Reporting ───────────────────────────────────────────────────

    def get_report(self) -> dict:
        current = None
        if self.current_watch:
            current = {
                "watch_id": self.current_watch.watch_id,
                "watch_number": self.current_watch.watch_number,
                "work_minutes": self.current_watch.total_work_minutes,
                "tokens_used": self.current_watch.total_tokens,
                "tasks_completed": len(self.current_watch.tasks),
                "overtime_minutes": self.current_watch.overtime_minutes,
                "remaining_minutes": self.watch_remaining(),
            }

        return {
            "agent_id": self.agent_id,
            "role": self.role,
            "status": self.status.value,
            "relief_agent": self.relief_agent_id,
            "current_watch": current,
            "working_context": {
                "pending_tasks": len(self.working_context["pending_tasks"]),
                "warnings": len(self.working_context["warnings"]),
                "tokens_in_context": self.working_context["tokens_in_context"],
            },
            "lifetime": {
                "total_watches": self.total_watches,
                "total_tasks": self.total_tasks,
                "total_work_minutes": self.total_work_minutes,
                "total_rest_minutes": self.total_rest_minutes,
                "total_handover_minutes": self.total_handover_minutes,
                "total_tokens_used": self.total_tokens_used,
                "total_overtime_minutes": self.total_overtime_minutes,
                "overtime_credits": self.overtime_credits,
                "handovers_completed": len(self.handover_history),
                "alarms_fired": sum(1 for a in self.alarm_history if a.fired_at),
            },
            "config": {
                "watch_hours": self.watch_minutes / 60,
                "rest_hours": self.rest_minutes / 60,
                "handover_minutes": self.handover_minutes,
                "overtime_rate": self.overtime_rate,
                "max_overtime_minutes": self.max_overtime_minutes,
                "token_budget": self.token_budget,
            },
        }

    def get_audit_log(self) -> list[dict]:
        log = []
        for w in self.watch_history:
            log.append({
                "type": "watch",
                "watch_id": w.watch_id,
                "watch_number": w.watch_number,
                "started_at": w.started_at,
                "ended_at": w.ended_at,
                "work_minutes": w.total_work_minutes,
                "tokens": w.total_tokens,
                "overtime": w.overtime_minutes,
                "credits_earned": w.overtime_credits_earned,
                "tasks": [{"name": t.task_name, "mins": t.minutes_spent, "tokens": t.tokens_used, "priority": t.priority.name} for t in w.tasks],
            })
        for h in self.handover_history:
            log.append({
                "type": "handover",
                "handover_id": h.handover_id,
                "from": h.from_agent,
                "to": h.to_agent,
                "started_at": h.started_at,
                "completed_at": h.completed_at,
                "duration": h.duration_minutes,
                "pending_tasks": len(h.pending_tasks),
                "warnings": len(h.warnings),
                "status": h.status,
            })
        for a in self.alarm_history:
            log.append({
                "type": "alarm",
                "alarm_id": a.alarm_id,
                "agent": a.agent_id,
                "scheduled_at": a.scheduled_at,
                "fired_at": a.fired_at,
                "acknowledged": a.acknowledged,
            })
        return sorted(log, key=lambda x: x.get("started_at") or x.get("scheduled_at", ""))

    def to_json(self) -> str:
        return json.dumps(self.get_report(), indent=2, default=str)


# ─── White Room Fleet Manager ───────────────────────────────────────────

class WhiteRoom:
    """
    Multi-agent work/rest governance manager with watch pairing.

    Manages agent pairs, orchestrates handovers, fires alarms,
    and provides fleet-level reporting.
    """

    def __init__(self, name: str = "default"):
        self.name = name
        self.agents: dict[str, AgentWorkTracker] = {}
        self.pairs: list[tuple[str, str]] = []
        self.created_at = datetime.now().isoformat()

    def register_agent(self, agent_id: str, role: str = "agent", **kwargs) -> AgentWorkTracker:
        tracker = AgentWorkTracker(agent_id=agent_id, role=role, **kwargs)
        self.agents[agent_id] = tracker
        return tracker

    def get_agent(self, agent_id: str) -> Optional[AgentWorkTracker]:
        return self.agents.get(agent_id)

    def pair_agents(self, agent_a: str, agent_b: str) -> dict:
        """Pair two agents for watch rotation. They relieve each other."""
        a, b = self.agents.get(agent_a), self.agents.get(agent_b)
        if not a or not b:
            return {"success": False, "error": "Both agents must be registered."}

        a.relief_agent_id = agent_b
        b.relief_agent_id = agent_a
        self.pairs.append((agent_a, agent_b))

        return {
            "success": True,
            "pair": [agent_a, agent_b],
            "cycle": f"{a.watch_minutes/60:.0f}h on / {a.handover_minutes}min handover / {a.rest_minutes/60:.0f}h off",
        }

    def initiate_handover(self, outgoing_id: str, incoming_id: str, pending_tasks: list = None, notes: str = "") -> dict:
        """
        Full handover sequence:
        1. Outgoing agent prepares handover document (context, pending tasks, warnings)
        2. Incoming agent receives and absorbs the handover
        3. Outgoing agent enters the White Room (rest + alarm set)
        4. Incoming agent starts their watch
        """
        outgoing = self.agents.get(outgoing_id)
        incoming = self.agents.get(incoming_id)

        if not outgoing or not incoming:
            return {"success": False, "error": "Both agents must be registered."}

        if incoming.status not in (AgentStatus.IDLE, AgentStatus.ALARM):
            return {"success": False, "error": f"Incoming agent is {incoming.status.value}, not available."}

        # Step 1: Outgoing prepares handover
        handover = outgoing.prepare_handover(pending_tasks=pending_tasks, notes=notes)
        handover.to_agent = incoming_id

        # Step 2: Incoming receives handover
        receive_result = incoming.receive_handover(handover)
        context = receive_result["context"]

        # Step 3: Outgoing enters White Room
        rest_result = outgoing.complete_handover_and_rest(handover)

        # Step 4: Incoming starts watch with received context
        watch_result = incoming.start_watch(handover_context=context)

        return {
            "success": True,
            "handover_id": handover.handover_id,
            "handover_duration": f"{outgoing.handover_minutes} minutes",
            "outgoing": {
                "agent": outgoing_id,
                "status": outgoing.status.value,
                "entered_white_room": True,
                "rest_hours": rest_result["rest_duration_hours"],
                "alarm_at": rest_result["alarm_at"],
                "context_cleared": True,
            },
            "incoming": {
                "agent": incoming_id,
                "status": incoming.status.value,
                "watch_number": watch_result.get("watch_number"),
                "received_pending_tasks": len(handover.pending_tasks),
                "received_warnings": len(handover.warnings),
            },
        }

    def fire_alarm(self, agent_id: str) -> dict:
        """Fire the wake-up alarm for a resting agent."""
        agent = self.agents.get(agent_id)
        if not agent:
            return {"success": False, "error": "Agent not found."}
        return agent.fire_alarm()

    def check_alarms(self) -> list[dict]:
        """Check all agents for due alarms. Returns list of agents that need waking."""
        now = datetime.now()
        due = []
        for agent in self.agents.values():
            if agent.status == AgentStatus.RESTING:
                for alarm in agent.alarm_history:
                    if not alarm.fired_at and alarm.scheduled_at:
                        alarm_time = datetime.fromisoformat(alarm.scheduled_at)
                        if now >= alarm_time:
                            result = agent.fire_alarm()
                            due.append(result)
        return due

    def get_fleet_report(self) -> dict:
        reports = {aid: a.get_report() for aid, a in self.agents.items()}
        totals = {
            "work_minutes": sum(r["lifetime"]["total_work_minutes"] for r in reports.values()),
            "rest_minutes": sum(r["lifetime"]["total_rest_minutes"] for r in reports.values()),
            "handover_minutes": sum(r["lifetime"]["total_handover_minutes"] for r in reports.values()),
            "tokens_used": sum(r["lifetime"]["total_tokens_used"] for r in reports.values()),
            "overtime_minutes": sum(r["lifetime"]["total_overtime_minutes"] for r in reports.values()),
            "overtime_credits": sum(r["lifetime"]["overtime_credits"] for r in reports.values()),
            "handovers_completed": sum(r["lifetime"]["handovers_completed"] for r in reports.values()),
        }
        if totals["rest_minutes"] > 0:
            totals["work_rest_ratio"] = round(totals["work_minutes"] / totals["rest_minutes"], 2)

        status_counts = {}
        for r in reports.values():
            s = r["status"]
            status_counts[s] = status_counts.get(s, 0) + 1

        return {
            "fleet_name": self.name,
            "total_agents": len(self.agents),
            "pairs": self.pairs,
            "status_breakdown": status_counts,
            "totals": totals,
            "agents": reports,
        }

    def get_overworked_agents(self) -> list[str]:
        return [aid for aid, a in self.agents.items() if a.is_overdue()]

    def get_idle_agents(self) -> list[str]:
        return [aid for aid, a in self.agents.items() if a.status == AgentStatus.IDLE]

    def get_resting_agents(self) -> list[str]:
        return [aid for aid, a in self.agents.items() if a.status == AgentStatus.RESTING]
