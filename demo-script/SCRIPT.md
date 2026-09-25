**[0:00–0:20] Open on the problem**

"Keycard allows you to control what an agent can access: tools, APIs, and data and every action it takes. I built an agent that calls Linear as itself. No personal API key in the code, no human clicking Allow, and the audit log captures the agent as the requester, not me.

**[0:20–0:45] Show the code has no secret**

> Open `keycard-demo/.env.example`. Do not open `.env` or `agent_keys/`.

"Here's the config. This is the example env, not the real one. No Linear API key. Just placeholders for the Keycard zone URL and a public Tailscale address."

> Then open `src/identity.ts` and point at `storageDir: "./agent_keys"`.

"The agent's identity is an RSA keypair. First startup writes it to `agent_keys/` on this machine. That folder is gitignored, so the private key never goes in the repo."

**[0:45–1:15] Show the Keycard side, fast**

> Switch to Keycard Console.

"Three things had to exist before this would work. A Resource for Linear's API, holding the key in a vault. An Application for the agent, with a URL credential instead of a secret — Keycard fetches the agent's public key over the internet and verifies it. And a dependency linking the two, which is what actually lets Keycard hand this agent the key."

**[1:15–1:40] Run it**

> Terminal, agent already running.

"Now I'll ask the agent who it is." Run the curl:

```bash
curl -X POST http://localhost:9000/a2a/jsonrpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tasks/send","id":"1","params":{"id":"task-1","message":{"role":"user","parts":[{"kind":"text","text":"Who am I in Linear?"}]}}}'
```

"That's a plain agent-to-agent request. No token in the header, because I don't have one — the agent gets its own."

**[1:40–2:00] Show the result**

"And it comes back with my Linear account. Behind the scenes: the agent signed a JWT with its private key, sent it to Keycard, Keycard checked the signature against the public key it fetched over Tailscale, and handed back the vaulted Linear key for exactly one call."

**[2:00–2:25] Show the audit trail**

> Switch to Keycard Console → Audit Log.

"And here's the proof: `credentials:issue`, issued to the agent, for the Linear resource, timestamped to the second I ran that curl. Not issued to me — to the agent. That's the whole point: every call is attributable to the identity that made it."

**[2:25–2:45] Close**

"The identity, the token exchange, and the audit trail all come from Keycard's SDK — I didn't write any of that part myself. What I did write is the part any team building an autonomous agent would: pick an API, wire it to a scoped credential, and ship it without a secret sitting in a config file anywhere."