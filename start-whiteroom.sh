#!/bin/bash
echo "=== Waking Render services ==="
curl -s https://whiteroom-m4j4.onrender.com/health
echo ""
curl -s https://event-planning-agents.onrender.com/health
echo ""
curl -s https://event-planning-relief.onrender.com/health
echo ""

echo "=== Registering agents ==="
curl -s -X POST https://whiteroom-m4j4.onrender.com/api/white-room \
  -H "Content-Type: application/json" \
  -d '{"action":"register_agent","fleet_id":"event-planning-fleet","agent_id":"alpha","agent_role":"Lead Planner"}'
echo ""
curl -s -X POST https://whiteroom-m4j4.onrender.com/api/white-room \
  -H "Content-Type: application/json" \
  -d '{"action":"register_agent","fleet_id":"event-planning-fleet","agent_id":"charlie","agent_role":"Coordinator"}'
echo ""
curl -s -X POST https://whiteroom-m4j4.onrender.com/api/white-room \
  -H "Content-Type: application/json" \
  -d '{"action":"register_agent","fleet_id":"event-planning-fleet","agent_id":"bravo","agent_role":"Planner Relief"}'
echo ""
curl -s -X POST https://whiteroom-m4j4.onrender.com/api/white-room \
  -H "Content-Type: application/json" \
  -d '{"action":"register_agent","fleet_id":"event-planning-fleet","agent_id":"delta","agent_role":"Coordinator Relief"}'
echo ""

echo "=== Pairing agents ==="
curl -s -X POST https://whiteroom-m4j4.onrender.com/api/white-room \
  -H "Content-Type: application/json" \
  -d '{"action":"pair_agents","fleet_id":"event-planning-fleet","agent_id":"alpha","paired_with":"bravo"}'
echo ""
curl -s -X POST https://whiteroom-m4j4.onrender.com/api/white-room \
  -H "Content-Type: application/json" \
  -d '{"action":"pair_agents","fleet_id":"event-planning-fleet","agent_id":"charlie","paired_with":"delta"}'
echo ""

echo "=== Starting watches ==="
curl -s -X POST https://whiteroom-m4j4.onrender.com/api/white-room \
  -H "Content-Type: application/json" \
  -d '{"action":"start_watch","fleet_id":"event-planning-fleet","agent_id":"alpha"}'
echo ""
curl -s -X POST https://whiteroom-m4j4.onrender.com/api/white-room \
  -H "Content-Type: application/json" \
  -d '{"action":"start_watch","fleet_id":"event-planning-fleet","agent_id":"charlie"}'
echo ""

echo "=== Starting smart task loop ==="
echo "Tasks will route to whichever agents are currently WORKING"

while true; do
  # Check Alpha status
  ALPHA_STATUS=$(curl -s -X POST https://whiteroom-m4j4.onrender.com/api/white-room \
    -H "Content-Type: application/json" \
    -d '{"action":"check_watch","fleet_id":"event-planning-fleet","agent_id":"alpha"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','idle'))" 2>/dev/null)

  # Check Bravo status
  BRAVO_STATUS=$(curl -s -X POST https://whiteroom-m4j4.onrender.com/api/white-room \
    -H "Content-Type: application/json" \
    -d '{"action":"check_watch","fleet_id":"event-planning-fleet","agent_id":"bravo"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','idle'))" 2>/dev/null)

  # Route planner task to whichever is working
  if [ "$ALPHA_STATUS" = "working" ]; then
    echo "[$(date +%H:%M:%S)] → Alpha (working)"
    curl -s -X POST https://event-planning-agents.onrender.com/alpha \
      -H "Content-Type: application/json" \
      -d '{"task":"Plan the wedding venue layout and coordinate with vendors"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print('tokens:', d.get('tokens',{}).get('total','?'))" 2>/dev/null
  elif [ "$BRAVO_STATUS" = "working" ]; then
    echo "[$(date +%H:%M:%S)] → Bravo (working)"
    curl -s -X POST https://event-planning-relief.onrender.com/bravo \
      -H "Content-Type: application/json" \
      -d '{"task":"Continue venue coordination from Alpha handover — confirm florist and DJ contracts"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print('tokens:', d.get('tokens',{}).get('total','?'))" 2>/dev/null
  else
    echo "[$(date +%H:%M:%S)] Planner pair resting — waiting..."
  fi

  sleep 55

  # Check Charlie status
  CHARLIE_STATUS=$(curl -s -X POST https://whiteroom-m4j4.onrender.com/api/white-room \
    -H "Content-Type: application/json" \
    -d '{"action":"check_watch","fleet_id":"event-planning-fleet","agent_id":"charlie"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','idle'))" 2>/dev/null)

  # Check Delta status
  DELTA_STATUS=$(curl -s -X POST https://whiteroom-m4j4.onrender.com/api/white-room \
    -H "Content-Type: application/json" \
    -d '{"action":"check_watch","fleet_id":"event-planning-fleet","agent_id":"delta"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','idle'))" 2>/dev/null)

  # Route coordinator task to whichever is working
  if [ "$CHARLIE_STATUS" = "working" ]; then
    echo "[$(date +%H:%M:%S)] → Charlie (working)"
    curl -s -X POST https://event-planning-agents.onrender.com/charlie \
      -H "Content-Type: application/json" \
      -d '{"task":"Review guest list and manage seating for 100 people"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print('tokens:', d.get('tokens',{}).get('total','?'))" 2>/dev/null
  elif [ "$DELTA_STATUS" = "working" ]; then
    echo "[$(date +%H:%M:%S)] → Delta (working)"
    curl -s -X POST https://event-planning-relief.onrender.com/delta \
      -H "Content-Type: application/json" \
      -d '{"task":"Continue guest management from Charlie handover — finalize seating chart and dietary list"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print('tokens:', d.get('tokens',{}).get('total','?'))" 2>/dev/null
  else
    echo "[$(date +%H:%M:%S)] Coordinator pair resting — waiting..."
  fi

  sleep 55
done
