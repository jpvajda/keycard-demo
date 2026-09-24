import { WebIdentity } from "@keycardai/oauth/server";
import { clientId, config } from "./config.js";

export const identity = new WebIdentity({
  storageDir: "./agent_keys",
  keyId: config.agentName,
  clientId: clientId(),
});

export function clientMetadata() {
  return {
    client_id: clientId(),
    client_name: config.agentName,
    token_endpoint_auth_method: "private_key_jwt",
    token_endpoint_auth_signing_alg: "RS256",
    jwks_uri: `${config.agentBaseUrl}/.well-known/jwks.json`,
    grant_types: [
      "client_credentials",
      "urn:ietf:params:oauth:grant-type:token-exchange",
    ],
    response_types: [],
  };
}
