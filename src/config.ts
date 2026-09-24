export const config = {
  keycardUrl: required("KEYCARD_URL").replace(/\/$/, ""),
  agentBaseUrl: required("AGENT_BASE_URL").replace(/\/$/, ""),
  port: Number(process.env.PORT ?? "9000"),
  agentName: process.env.AGENT_NAME ?? "linear-agent",
  linearResource: process.env.LINEAR_RESOURCE ?? "https://api.linear.app/graphql",
};

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Set ${name}. Copy .env.example to .env and fill it in.`);
  }
  return value;
}

export function clientId(): string {
  return `${config.agentBaseUrl}/.well-known/oauth-client-metadata`;
}
