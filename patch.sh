#!/bin/bash
cd ~/Desktop/WhiteRoom

echo "=== Patching engine.js ==="
python3 << 'PYEOF'
with open('engine.js', 'r') as f:
    content = f.read()

new_methods = '''
  setFleetKey(fleetId, apiKey) {
    const fleet = this._getOrCreateFleet(fleetId);
    if (!fleet.apiKeyHash) {
      const crypto = require("crypto");
      fleet.apiKeyHash = crypto.createHash("sha256").update(apiKey).digest("hex").slice(0, 16);
    }
  }

  getFleetKey(fleetId) {
    const fleet = this._getOrCreateFleet(fleetId);
    return fleet.apiKeyHash || null;
  }

  hashKey(apiKey) {
    const crypto = require("crypto");
    return crypto.createHash("sha256").update(apiKey).digest("hex").slice(0, 16);
  }

  setFleetEndpoint(fleetId, endpoint) {
    const fleet = this._getOrCreateFleet(fleetId);
    fleet.llmEndpoint = endpoint;
  }

  getFleetEndpoint(fleetId) {
    const fleet = this._getOrCreateFleet(fleetId);
    return fleet.llmEndpoint || "https://api.anthropic.com";
  }

'''

if 'setFleetKey' not in content:
    content = content.replace('module.exports', new_methods + 'module.exports')
    with open('engine.js', 'w') as f:
        f.write(content)
    print("engine.js patched successfully")
else:
    print("engine.js already patched")
PYEOF

echo "=== Patching server.js ==="
python3 << 'PYEOF'
with open('server.js', 'r') as f:
    content = f.read()

if 'const { URL }' not in content:
    content = content.replace('const https = require("https");', 'const https = require("https");\nconst { URL } = require("url");')
    print("Added URL import")

auth_check = '''
    const requestKey = req.headers["x-api-key"] || (req.headers["authorization"] || "").replace("Bearer ", "");
    const sensitiveActions = ["get_handover", "generate_handover", "store_handover", "fleet_report", "check_watch"];
    if (sensitiveActions.includes(action) && requestKey) {
      const fleetKeyHash = whiteRoom.getFleetKey(fleetId);
      if (fleetKeyHash) {
        const requestKeyHash = whiteRoom.hashKey(requestKey);
        if (requestKeyHash !== fleetKeyHash) {
          return res.status(401).json({ error: "Unauthorized. Use the same API key that registered this fleet." });
        }
      }
    }

'''

if 'sensitiveActions' not in content:
    content = content.replace('    switch (action) {', auth_check + '    switch (action) {')
    print("Added auth check")

if 'setFleetKey' not in content:
    old = '      case "register_agent": {\n        if (!agent_id) return res.status(400).json({ error: "agent_id is required." });\n        const result = whiteRoom.registerAgent(fleetId, agent_id, agent_role || "worker");\n        return res.json(result);\n      }'
    new = '''      case "register_agent": {
        if (!agent_id) return res.status(400).json({ error: "agent_id is required." });
        const regKey = req.headers["x-api-key"] || (req.headers["authorization"] || "").replace("Bearer ", "");
        if (regKey) whiteRoom.setFleetKey(fleetId, regKey);
        const { llm_endpoint } = req.body;
        if (llm_endpoint) whiteRoom.setFleetEndpoint(fleetId, llm_endpoint);
        const result = whiteRoom.registerAgent(fleetId, agent_id, agent_role || "worker");
        return res.json(result);
      }'''
    if old in content:
        content = content.replace(old, new)
        print("Updated register_agent")
    else:
        print("WARNING: Could not find register_agent pattern - check server.js manually")

if 'getFleetEndpoint' not in content:
    old_proxy = '    hostname: "api.anthropic.com",\n    port: 443,\n    path: "/v1/messages",'
    new_proxy = '''    hostname: (() => { try { return new URL(whiteRoom.getFleetEndpoint(fleetId)).hostname; } catch(e) { return "api.anthropic.com"; } })(),
    port: 443,
    path: "/v1/messages",'''
    if old_proxy in content:
        content = content.replace(old_proxy, new_proxy)
        print("Updated proxy to use fleet LLM endpoint")
    else:
        print("WARNING: Could not find proxy pattern")

with open('server.js', 'w') as f:
    f.write(content)
print("server.js patched")
PYEOF

echo "=== Verifying ==="
grep -n "setFleetKey\|sensitiveActions\|getFleetEndpoint\|hashKey" engine.js server.js

echo ""
echo "Now run: git add -A && git commit -m 'feat: auth, key hashing, LLM-agnostic proxy' && git push"
