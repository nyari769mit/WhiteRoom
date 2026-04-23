import hashlib

with open('/Users/nyarinain/Desktop/WhiteRoom/engine.js', 'r') as f:
    engine = f.read()

with open('/Users/nyarinain/Desktop/WhiteRoom/server.js', 'r') as f:
    server = f.read()

# ── 1. Add llmEndpoint and key hashing to engine.js ──────────

# Add llmEndpoint to registerAgent
old_register_agent = '''  registerAgent(fleetId, agentId, role = "worker", watchMinutes = 10, restMinutes = 10, handoverMinutes = 5) {'''

new_register_agent = '''  registerAgent(fleetId, agentId, role = "worker", watchMinutes = 10, restMinutes = 10, handoverMinutes = 5, llmEndpoint = "https://api.anthropic.com") {'''

if 'llmEndpoint = "https://api.anthropic.com"' not in engine:
    engine = engine.replace(old_register_agent, new_register_agent)
    print('✓ Added llmEndpoint param to registerAgent')

# Store llmEndpoint on agent
old_agent_create = '''      watchMinutes,
      restMinutes,'''

new_agent_create = '''      watchMinutes,
      restMinutes,
      llmEndpoint,'''

if 'llmEndpoint,' not in engine:
    engine = engine.replace(old_agent_create, new_agent_create)
    print('✓ Added llmEndpoint storage on agent')

# Add setFleetEndpoint and getFleetEndpoint methods
fleet_endpoint_methods = '''
  setFleetEndpoint(fleetId, endpoint) {
    const fleet = this._getOrCreateFleet(fleetId);
    fleet.llmEndpoint = endpoint;
  }

  getFleetEndpoint(fleetId) {
    const fleet = this._getOrCreateFleet(fleetId);
    return fleet.llmEndpoint || "https://api.anthropic.com";
  }

'''

if 'setFleetEndpoint' not in engine:
    engine = engine.replace('  setFleetKey(', fleet_endpoint_methods + '  setFleetKey(')
    print('✓ Added setFleetEndpoint/getFleetEndpoint to engine.js')

# Add key hashing to setFleetKey
old_set_fleet_key = '''  setFleetKey(fleetId, apiKey) {
    const fleet = this._getOrCreateFleet(fleetId);
    if (!fleet.apiKey) fleet.apiKey = apiKey; // only set once
  }

  getFleetKey(fleetId) {
    const fleet = this._getOrCreateFleet(fleetId);
    return fleet.apiKey || null;
  }'''

new_set_fleet_key = '''  setFleetKey(fleetId, apiKey) {
    const fleet = this._getOrCreateFleet(fleetId);
    if (!fleet.apiKeyHash) {
      // Store hash only — never the raw key
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
  }'''

if 'apiKeyHash' not in engine:
    engine = engine.replace(old_set_fleet_key, new_set_fleet_key)
    print('✓ Added key hashing to setFleetKey')

with open('/Users/nyarinain/Desktop/WhiteRoom/engine.js', 'w') as f:
    f.write(engine)
print('✓ engine.js updated')

# ── 2. Update server.js ───────────────────────────────────────

# Update register_agent to accept llm_endpoint
old_reg = '''      case "register_agent": {
        if (!agent_id) return res.status(400).json({ error: "agent_id is required." });
        // Store the API key used for this fleet registration
        const regApiKey = req.headers["x-api-key"] || req.headers["authorization"]?.replace("Bearer ", "");
        if (regApiKey) whiteRoom.setFleetKey(fleetId, regApiKey);
        const result = whiteRoom.registerAgent(fleetId, agent_id, agent_role || "worker");
        return res.json(result);
      }'''

new_reg = '''      case "register_agent": {
        if (!agent_id) return res.status(400).json({ error: "agent_id is required." });
        // Store hashed API key for fleet auth
        const regApiKey = req.headers["x-api-key"] || req.headers["authorization"]?.replace("Bearer ", "");
        if (regApiKey) whiteRoom.setFleetKey(fleetId, regApiKey);
        // Store LLM endpoint for this fleet
        const { llm_endpoint } = req.body;
        if (llm_endpoint) whiteRoom.setFleetEndpoint(fleetId, llm_endpoint);
        const result = whiteRoom.registerAgent(fleetId, agent_id, agent_role || "worker", 10, 10, 5, llm_endpoint || "https://api.anthropic.com");
        return res.json(result);
      }'''

if 'llm_endpoint' not in server:
    server = server.replace(old_reg, new_reg)
    print('✓ Updated register_agent to accept llm_endpoint')

# Update auth check to use hash comparison
old_auth = '''    const requestKey = req.headers["x-api-key"] || req.headers["authorization"]?.replace("Bearer ", "");
    const sensitiveActions = ["get_handover", "generate_handover", "store_handover", "fleet_report", "check_watch"];
    if (sensitiveActions.includes(action)) {
      const fleetKey = whiteRoom.getFleetKey(fleetId);
      if (fleetKey && requestKey !== fleetKey) {
        return res.status(401).json({ error: "Unauthorized. Provide the same API key used to register this fleet." });
      }
    }'''

new_auth = '''    const requestKey = req.headers["x-api-key"] || req.headers["authorization"]?.replace("Bearer ", "");
    const sensitiveActions = ["get_handover", "generate_handover", "store_handover", "fleet_report", "check_watch"];
    if (sensitiveActions.includes(action)) {
      const fleetKeyHash = whiteRoom.getFleetKey(fleetId);
      const requestKeyHash = requestKey ? whiteRoom.hashKey(requestKey) : null;
      if (fleetKeyHash && requestKeyHash !== fleetKeyHash) {
        return res.status(401).json({ error: "Unauthorized. Provide the same API key used to register this fleet." });
      }
    }'''

if 'requestKeyHash' not in server:
    server = server.replace(old_auth, new_auth)
    print('✓ Updated auth to use hash comparison')

# Update /v1/messages proxy to use fleet's LLM endpoint
old_proxy = '''  // Proxy the request to the real Claude API
  const anthropicReq = https.request({
    hostname: "api.anthropic.com",
    port: 443,
    path: "/v1/messages",'''

new_proxy = '''  // Proxy the request to the fleet's configured LLM endpoint
  const llmEndpoint = whiteRoom.getFleetEndpoint(fleetId);
  const llmUrl = new URL(llmEndpoint.includes("/v1/messages") ? llmEndpoint : llmEndpoint + "/v1/messages");
  const anthropicReq = https.request({
    hostname: llmUrl.hostname,
    port: 443,
    path: llmUrl.pathname,'''

if 'getFleetEndpoint' not in server:
    server = server.replace(old_proxy, new_proxy)
    print('✓ Updated /v1/messages proxy to use fleet LLM endpoint')

# Add URL parsing requirement at top of server
if "new URL(" in server and "require('url')" not in server and 'const { URL }' not in server:
    server = server.replace('const https = require("https");', 'const https = require("https");\nconst { URL } = require("url");')
    print('✓ Added URL import')

with open('/Users/nyarinain/Desktop/WhiteRoom/server.js', 'w') as f:
    f.write(server)
print('✓ server.js updated')
print('\nDone! Run: cd ~/Desktop/WhiteRoom && git add -A && git commit -m "feat: LLM-agnostic proxy, key hashing, configurable endpoints" && git push')
