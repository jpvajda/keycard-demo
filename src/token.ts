import { clientId, config } from "./config.js";
import { identity } from "./identity.js";

type Cached = { token: string; expiresAt: number };

let cached: Cached | undefined;

export async function linearApiKey(): Promise<string> {
  if (cached && cached.expiresAt > Date.now() + 30_000) {
    return cached.token;
  }

  const tokenEndpoint = `${config.keycardUrl}/oauth/2/token`;
  const request = await identity.prepareTokenExchangeRequest("", config.linearResource, {
    tokenEndpoint,
    authInfo: { resource_client_id: clientId() },
  });

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    client_assertion: request.clientAssertion ?? "",
    resource: config.linearResource,
  });

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !payload.access_token) {
    throw new Error(
      `Keycard token exchange failed (${response.status}): ${payload.error ?? "unknown"} ${payload.error_description ?? ""}`.trim(),
    );
  }

  cached = {
    token: payload.access_token,
    expiresAt: Date.now() + (payload.expires_in ?? 300) * 1000,
  };
  return payload.access_token;
}
