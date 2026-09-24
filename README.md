# keycard-demo

Agent that calls Linear as itself. Keycard vaults the personal API key. The agent proves its identity with a signed JWT and never stores the Linear key.

This follows [Grant Agent Access to APIs](https://docs.keycard.ai/guides/grant-agent-access-to-apis/) with Linear in place of Snowflake.

## What this demo gives you

- An agent with its own identity. Its private key stays in `agent_keys/` on this machine.
- A Linear personal API key that lives in a Keycard vault, not in `.env` or the repo.
- One A2A request that returns the Linear user behind that key.
- An audit entry, `credentials:issue`, recorded under the agent. See [Reading the Audit Log & Sessions](https://docs.keycard.ai/admin/audit-log-and-sessions/).

## Tailscale setup

Keycard must download the agent’s public key from the public internet. [Tailscale Funnel](https://tailscale.com/kb/1223/funnel) publishes only port `9000`. The rest of this Mac stays private. Install Tailscale from the [macOS download page](https://tailscale.com/download/macos).

1. Open Tailscale and click **Allow** on the VPN and network-extension prompts. In System Settings, turn the Tailscale network extension on if macOS asks.
2. Sign in. Everyday traffic still uses your normal connection. Do not turn on an exit node.
3. In the [Tailscale admin console](https://login.tailscale.com/admin/dns), turn on **MagicDNS**, **HTTPS certificates**, and **Funnel**.
4. Start the funnel:

```bash
tailscale funnel --bg 9000
```

Copy the printed `https://….ts.net` URL into `AGENT_BASE_URL` in `.env`. No path and no port.

5. When you are done for the day, stop the agent with Ctrl+C, then turn Funnel off:

```bash
tailscale funnel --https=443 off
```

Leave Funnel off when you are not running the demo. While Funnel and the agent are both up, the A2A endpoint is public, and a request to it calls Linear with the vaulted key.

## Keycard setup

Do this once in Keycard Console before the first request. Details: [Applications](https://docs.keycard.ai/concepts/applications/), [Resources](https://docs.keycard.ai/concepts/resources/), and [Credential issuance](https://docs.keycard.ai/concepts/credentials/).

1. Create a Linear personal API key. Linear → Settings → Account → Security & access. See [Linear’s GraphQL docs](https://linear.app/developers/graphql).
2. Create a resource named `Linear GraphQL API`. Identifier: `https://api.linear.app/graphql`. Leave **MCP Server** off. Save, then **Add credential** and paste the `lin_api_…` key. The key is not a field on the create form.
3. Complete [Tailscale setup](#tailscale-setup) and set `AGENT_BASE_URL`.
4. Create an application for the agent. Set consent to **Implicit** so no one has to approve each call.
5. Add a **URL** credential on that application. Identifier:

`https://<your-funnel-host>/.well-known/oauth-client-metadata`

6. On the same application, add a dependency on the resource `https://api.linear.app/graphql`. That link is what allows Keycard to hand this agent the vaulted key.

## Run

1. Copy `.env.example` to `.env`. Set `AGENT_BASE_URL` to the Tailscale Funnel URL.
2. Vault the Linear key on resource `https://api.linear.app/graphql` and attach it to this agent.
3. Start the funnel, then the agent:

```bash
tailscale funnel --bg 9000
keycard run -- npm start
```

4. Ask who you are:

```bash
curl -X POST http://localhost:9000/a2a/jsonrpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tasks/send","id":"1","params":{"id":"task-1","message":{"role":"user","parts":[{"kind":"text","text":"Who am I in Linear?"}]}}}'
```

Done when the reply includes your Linear name and Keycard Audit Log shows `credentials:issue` for `https://api.linear.app/graphql`.
