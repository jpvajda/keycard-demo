import express from "express";
import { config } from "./config.js";
import { clientMetadata, identity } from "./identity.js";
import { linearViewer } from "./linear.js";

type JsonRpc = {
  jsonrpc?: string;
  id?: unknown;
  method?: string;
  params?: {
    id?: string;
    message?: { parts?: { kind?: string; text?: string }[] };
  };
};

const app = express();
app.use(express.json());

app.get("/.well-known/jwks.json", (_req, res) => {
  res.json(identity.getPublicJwks());
});

app.get("/.well-known/oauth-client-metadata", (_req, res) => {
  res.json(clientMetadata());
});

app.get("/.well-known/agent-card.json", (_req, res) => {
  res.json({
    name: config.agentName,
    description: "Answers with the Linear account behind the vaulted API key.",
    protocolVersion: "0.3.0",
    url: `${config.agentBaseUrl}/a2a/jsonrpc`,
    version: "0.1.0",
    capabilities: { streaming: false },
    defaultInputModes: ["text/plain"],
    defaultOutputModes: ["text/plain"],
    skills: [
      {
        id: "linear-viewer",
        name: "Linear viewer",
        description: "Return the Linear user for the vaulted personal API key.",
        tags: ["linear"],
      },
    ],
  });
});

app.post("/a2a/jsonrpc", async (req, res) => {
  const body = req.body as JsonRpc;
  try {
    const text = messageText(body);
    const viewer = await linearViewer();
    const answer = text.toLowerCase().includes("who")
      ? `${viewer.name} <${viewer.email}> (${viewer.id})`
      : `Linear viewer: ${viewer.name} <${viewer.email}> (${viewer.id})`;

    res.json({
      jsonrpc: "2.0",
      id: body.id ?? null,
      result: {
        id: body.params?.id ?? "task-1",
        status: { state: "completed" },
        message: {
          role: "agent",
          parts: [{ kind: "text", text: answer }],
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "request failed";
    res.status(200).json({
      jsonrpc: "2.0",
      id: body.id ?? null,
      error: { code: -32000, message },
    });
  }
});

function messageText(body: JsonRpc): string {
  const parts = body.params?.message?.parts ?? [];
  return parts.map((part) => part.text ?? "").join(" ").trim();
}

await identity.bootstrap();

app.listen(config.port, () => {
  console.log(`linear agent listening on ${config.port}`);
  console.log(`client_id ${config.agentBaseUrl}/.well-known/oauth-client-metadata`);
});
