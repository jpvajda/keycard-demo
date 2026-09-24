import { config } from "./config.js";
import { linearApiKey } from "./token.js";

const VIEWER_QUERY = `query Viewer { viewer { id name email } }`;

export type LinearViewer = { id: string; name: string; email: string };

export async function linearViewer(): Promise<LinearViewer> {
  const apiKey = await linearApiKey();
  const response = await fetch(config.linearResource, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({ query: VIEWER_QUERY }),
  });

  const payload = (await response.json()) as {
    data?: { viewer?: LinearViewer };
    errors?: { message: string }[];
  };

  if (!response.ok || payload.errors?.length || !payload.data?.viewer) {
    const message = payload.errors?.map((error) => error.message).join("; ");
    throw new Error(message || `Linear request failed (${response.status})`);
  }

  return payload.data.viewer;
}
