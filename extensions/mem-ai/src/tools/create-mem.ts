import { getPreferenceValues } from "@raycast/api";

interface Preferences {
  apiKey: string;
}

type Input = {
  /**
   * The content of the note to create
   */
  content: string;
};

export default async function tool(input: Input) {
  const { apiKey } = getPreferenceValues<Preferences>();

  const response = await fetch("https://api.mem.ai/v0/mems", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `ApiAccessToken ${apiKey}`,
    },
    body: JSON.stringify({
      content: input.content,
    }),
  });

  if (!response.ok) {
    return { success: false, error: `API Error: ${response.status}` };
  }

  return { success: true, message: "Note created in Mem" };
}
