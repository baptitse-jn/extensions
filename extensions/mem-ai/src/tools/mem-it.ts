import { getPreferenceValues } from "@raycast/api";

interface Preferences {
  apiKey: string;
}

type Input = {
  /**
   * The content to send to Mem
   */
  content: string;
  /**
   * Optional instructions for AI processing
   */
  instructions?: string;
};

interface MemItResponse {
  id?: string;
  url?: string;
}

export default async function tool(input: Input) {
  const { apiKey } = getPreferenceValues<Preferences>();

  const response = await fetch("https://api.mem.ai/v2/mem-it", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `ApiAccessToken ${apiKey}`,
    },
    body: JSON.stringify({
      content: input.content,
      instructions: input.instructions || undefined,
    }),
  });

  if (!response.ok) {
    return { success: false, error: `API Error: ${response.status}` };
  }

  const data = (await response.json()) as MemItResponse;

  return {
    success: true,
    message: "Content saved to Mem with AI processing",
    id: data.id,
    url: data.url,
  };
}
