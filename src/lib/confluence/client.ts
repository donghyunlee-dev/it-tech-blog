import { requireEnv } from "@/lib/env";

function getConfluenceConfig() {
  return {
    baseUrl: requireEnv("CONFLUENCE_BASE_URL"),
    email: requireEnv("CONFLUENCE_EMAIL"),
    apiToken: requireEnv("CONFLUENCE_API_TOKEN"),
  };
}

function buildAuthHeader(email: string, apiToken: string) {
  return `Basic ${Buffer.from(`${email}:${apiToken}`).toString("base64")}`;
}

export async function getCurrentConfluenceUser() {
  const { baseUrl, email, apiToken } = getConfluenceConfig();

  const response = await fetch(`${baseUrl}/rest/api/user/current`, {
    headers: {
      Authorization: buildAuthHeader(email, apiToken),
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Confluence API 호출 실패: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
