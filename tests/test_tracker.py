"""
White Room v0.2 - Test Suite
Tests watch cycles, handovers, alarms, and fleet management.

Run: python3 tests/test_v2.py
"""

import sys
sys.path.insert(0, "src")

from tracker import AgentWorkTracker, WhiteRoom, AgentStatus, TaskPriority


def test_6on_6off_cycle():
    """Full 6-on/6-off watch cycle with default config."""
    t = AgentWorkTracker("alpha", role="Researcher", watch_hours=6, rest_hours=6)

    assert t.watch_minutes == 360  # 6 hours
    assert t.rest_minutes == 360
    assert t.handover_minutes == 5

    r = t.start_watch()
    assert r["success"]
    assert r["watch_duration"] == "6h"
    assert t.status == AgentStatus.WORKING
    print("  PASS: 6on_6off_cycle")


def test_watch_remaining():
    """Track remaining time in watch."""
    t = AgentWorkTracker("alpha", watch_hours=6)

    t.start_watch()
    t.complete_task("work_1", minutes=120, tokens_used=5000)
    assert t.watch_remaining() == 240  # 4 hours left

    t.complete_task("work_2", minutes=180, tokens_used=8000)
    assert t.watch_remaining() == 60  # 1 hour left

    assert not t.needs_handover()  # 60min > 5min handover window

    t.complete_task("work_3", minutes=56, tokens_used=2000)
    assert t.needs_handover()  # 4min remaining < 5min handover
    print("  PASS: watch_remaining")


def test_handover_preparation():
    """Outgoing agent prepares handover document."""
    t = AgentWorkTracker("alpha", watch_hours=6)

    t.start_watch()
    t.complete_task("research", minutes=180, tokens_used=8000)
    t.complete_task("analysis", minutes=150, tokens_used=6000, error_count=2)

    handover = t.prepare_handover(
        pending_tasks=["Write summary", "Review citations"],
        notes="Found inconsistency in source #3"
    )

    assert handover.from_agent == "alpha"
    assert len(handover.pending_tasks) == 2
    assert len(handover.warnings) == 1  # 1 task had errors
    assert handover.duration_minutes == 5
    assert t.status == AgentStatus.HANDOVER_OUT
    print("  PASS: handover_preparation")


def test_handover_receive():
    """Incoming agent receives handover and absorbs context."""
    outgoing = AgentWorkTracker("alpha", watch_hours=6)
    incoming = AgentWorkTracker("bravo", watch_hours=6)

    outgoing.start_watch()
    outgoing.complete_task("research", minutes=300, tokens_used=10000)

    handover = outgoing.prepare_handover(
        pending_tasks=["Finish analysis", "Write report"],
        notes="Key dataset found in source #7"
    )
    handover.to_agent = "bravo"

    result = incoming.receive_handover(handover)
    assert result["success"]
    assert result["pending_tasks"] == 2
    assert result["context_absorbed"]

    context = result["context"]
    assert len(context["pending_tasks"]) == 2
    assert context["tokens_in_context"] == 10000
    print("  PASS: handover_receive")


def test_full_handover_sequence():
    """Complete handover: outgoing rests, incoming starts."""
    wr = WhiteRoom("test-crew")
    alpha = wr.register_agent("alpha", role="Researcher", watch_hours=6, rest_hours=6)
    bravo = wr.register_agent("bravo", role="Researcher", watch_hours=6, rest_hours=6)

    wr.pair_agents("alpha", "bravo")
    assert alpha.relief_agent_id == "bravo"
    assert bravo.relief_agent_id == "alpha"

    # Alpha works a full watch
    alpha.start_watch()
    alpha.complete_task("research_phase_1", minutes=180, tokens_used=8000)
    alpha.complete_task("research_phase_2", minutes=180, tokens_used=7000)

    # Handover: alpha -> bravo
    result = wr.initiate_handover(
        "alpha", "bravo",
        pending_tasks=["Compile findings", "Draft summary"],
        notes="Check source #12 for discrepancy"
    )

    assert result["success"]
    assert result["outgoing"]["entered_white_room"]
    assert result["outgoing"]["context_cleared"]
    assert alpha.status == AgentStatus.RESTING
    assert bravo.status == AgentStatus.WORKING
    assert result["incoming"]["received_pending_tasks"] == 2
    print("  PASS: full_handover_sequence")


def test_alarm_system():
    """Alarm fires after rest period."""
    t = AgentWorkTracker("alpha", watch_hours=6, rest_hours=6)

    t.start_watch()
    t.complete_task("work", minutes=360, tokens_used=15000)
    handover = t.prepare_handover()
    t.complete_handover_and_rest(handover)

    assert t.status == AgentStatus.RESTING
    assert len(t.alarm_history) == 1
    assert t.alarm_history[0].scheduled_at is not None

    # Fire alarm
    result = t.fire_alarm()
    assert result["success"]
    assert t.status == AgentStatus.ALARM

    # Acknowledge
    ack = t.acknowledge_alarm()
    assert ack["success"]
    assert t.status == AgentStatus.IDLE
    assert ack["ready_for_handover"]
    print("  PASS: alarm_system")


def test_context_cleared_after_rest():
    """Working context is cleared when agent enters White Room."""
    t = AgentWorkTracker("alpha", watch_hours=6)

    t.start_watch()
    t.complete_task("research", minutes=200, tokens_used=8000, error_count=3)
    t.working_context["key_findings"] = ["Important finding A", "Important finding B"]
    t.working_context["pending_tasks"] = ["Task X"]

    assert t.working_context["tokens_in_context"] == 8000
    assert len(t.working_context["warnings"]) == 1

    handover = t.prepare_handover()
    t.complete_handover_and_rest(handover)

    # Context should be completely cleared
    assert t.working_context["tokens_in_context"] == 0
    assert len(t.working_context["pending_tasks"]) == 0
    assert len(t.working_context["warnings"]) == 0
    assert len(t.working_context["key_findings"]) == 0
    print("  PASS: context_cleared_after_rest")


def test_overtime_during_watch():
    """Agent works past watch limit, earns credits."""
    t = AgentWorkTracker("alpha", watch_hours=6, overtime_rate=1.5)

    t.start_watch()
    t.complete_task("long_task", minutes=360, tokens_used=15000)  # Exactly at limit
    r = t.complete_task("extra_task", minutes=30, tokens_used=2000)  # 30min overtime

    assert r["overtime"]
    assert r["overtime_minutes"] == 30
    assert r["credits_earned"] == 45  # 30 * 1.5
    assert r["needs_handover"]
    assert t.status == AgentStatus.OVERTIME
    print("  PASS: overtime_during_watch")


def test_forced_rest_at_hard_cap():
    """Agent hits max overtime and gets blocked."""
    t = AgentWorkTracker("alpha", watch_hours=6, max_overtime_minutes=60)

    t.start_watch()
    t.complete_task("work", minutes=360, tokens_used=10000)
    t.complete_task("overtime_1", minutes=30, tokens_used=2000)
    r = t.complete_task("overtime_2", minutes=35, tokens_used=2000)  # 65min OT > 60 cap

    assert r["forced_rest"]
    assert t.status == AgentStatus.BLOCKED
    print("  PASS: forced_rest_at_hard_cap")


def test_blocked_agent_cannot_work():
    """Blocked agent must rest before working again."""
    t = AgentWorkTracker("alpha", watch_hours=1, max_overtime_minutes=30)

    t.start_watch()
    t.complete_task("work", minutes=60, tokens_used=1000)
    t.complete_task("overtime", minutes=35, tokens_used=1000)  # Blocked

    r = t.complete_task("nope", minutes=5, tokens_used=100)
    assert not r["success"]
    assert "blocked" in r["error"]

    # Must take rest
    handover = t.prepare_handover()
    rest = t.complete_handover_and_rest(handover)
    assert rest["success"]
    assert t.status == AgentStatus.RESTING
    print("  PASS: blocked_agent_cannot_work")


def test_priority_compensation():
    """Critical tasks earn 2x credits during overtime."""
    t1 = AgentWorkTracker("a1", watch_hours=1, overtime_rate=1.5)
    t2 = AgentWorkTracker("a2", watch_hours=1, overtime_rate=1.5)

    # Normal priority overtime
    t1.start_watch()
    t1.complete_task("setup", minutes=60, tokens_used=1000)
    r1 = t1.complete_task("normal", minutes=10, tokens_used=500, priority=TaskPriority.NORMAL)

    # Critical priority overtime
    t2.start_watch()
    t2.complete_task("setup", minutes=60, tokens_used=1000)
    r2 = t2.complete_task("critical", minutes=10, tokens_used=500, priority=TaskPriority.CRITICAL)

    assert r2["credits_earned"] == r1["credits_earned"] * 2
    print("  PASS: priority_compensation")


def test_fleet_report():
    """Fleet report across paired agents."""
    wr = WhiteRoom("fleet-test")
    wr.register_agent("alpha", role="Researcher", watch_hours=6)
    wr.register_agent("bravo", role="Researcher", watch_hours=6)
    wr.pair_agents("alpha", "bravo")

    alpha = wr.get_agent("alpha")
    alpha.start_watch()
    alpha.complete_task("work", minutes=200, tokens_used=8000)

    report = wr.get_fleet_report()
    assert report["total_agents"] == 2
    assert len(report["pairs"]) == 1
    assert report["totals"]["work_minutes"] == 200
    assert report["totals"]["tokens_used"] == 8000
    assert "alpha" in report["agents"]
    print("  PASS: fleet_report")


def test_multiple_watch_rotations():
    """Two agents rotate through multiple watches."""
    wr = WhiteRoom("rotation-test")
    wr.register_agent("alpha", role="Researcher", watch_hours=1, rest_hours=1)
    wr.register_agent("bravo", role="Researcher", watch_hours=1, rest_hours=1)
    wr.pair_agents("alpha", "bravo")

    alpha, bravo = wr.get_agent("alpha"), wr.get_agent("bravo")

    # Rotation 1: Alpha works, hands over to Bravo
    alpha.start_watch()
    alpha.complete_task("work_a1", minutes=55, tokens_used=2000)
    wr.initiate_handover("alpha", "bravo", pending_tasks=["Continue research"])

    assert alpha.status == AgentStatus.RESTING
    assert bravo.status == AgentStatus.WORKING

    # Rotation 2: Bravo works, alpha alarm fires, hands back to Alpha
    bravo.complete_task("work_b1", minutes=55, tokens_used=2000)

    alpha.fire_alarm()
    alpha.acknowledge_alarm()
    wr.initiate_handover("bravo", "alpha", pending_tasks=["Final review"])

    assert bravo.status == AgentStatus.RESTING
    assert alpha.status == AgentStatus.WORKING
    assert alpha.total_watches == 2
    assert bravo.total_watches == 1
    print("  PASS: multiple_watch_rotations")


def test_audit_log():
    """Full audit trail includes watches, handovers, and alarms."""
    wr = WhiteRoom("audit-test")
    wr.register_agent("alpha", role="Researcher", watch_hours=1, rest_hours=1)
    wr.register_agent("bravo", role="Researcher", watch_hours=1, rest_hours=1)

    alpha, bravo = wr.get_agent("alpha"), wr.get_agent("bravo")

    alpha.start_watch()
    alpha.complete_task("work", minutes=55, tokens_used=2000)
    wr.initiate_handover("alpha", "bravo")

    log = alpha.get_audit_log()
    types = [entry["type"] for entry in log]

    assert "watch" in types
    assert "handover" in types
    assert "alarm" in types
    print("  PASS: audit_log")


def test_handover_5_minutes():
    """Handover is exactly 5 minutes."""
    t = AgentWorkTracker("alpha", handover_minutes=5)

    t.start_watch()
    t.complete_task("work", minutes=300, tokens_used=10000)

    handover = t.prepare_handover()
    assert handover.duration_minutes == 5
    assert t.total_handover_minutes == 5
    print("  PASS: handover_5_minutes")


if __name__ == "__main__":
    print("\n=== White Room v0.2 Test Suite ===\n")
    test_6on_6off_cycle()
    test_watch_remaining()
    test_handover_preparation()
    test_handover_receive()
    test_full_handover_sequence()
    test_alarm_system()
    test_context_cleared_after_rest()
    test_overtime_during_watch()
    test_forced_rest_at_hard_cap()
    test_blocked_agent_cannot_work()
    test_priority_compensation()
    test_fleet_report()
    test_multiple_watch_rotations()
    test_audit_log()
    test_handover_5_minutes()
    print(f"\n=== All 15 tests passed ===\n")
