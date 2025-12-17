import { getPreferenceValues } from "@raycast/api";

interface Preferences {
  apiKey: string;
  defaultInstructions: string;
}

interface MemItResponse {
  id: string;
  url: string;
}

interface CreateMemResponse {
  id: string;
  url: string;
  createdAt: string;
}

/**
 * Get API preferences
 */
export function getPreferences(): Preferences {
  return getPreferenceValues<Preferences>();
}

/**
 * Mem It - Send content to Mem with AI processing
 * The content will be automatically organized, tagged, and structured
 */
export async function memIt(
  content: string,
  instructions?: string
): Promise<MemItResponse> {
  const { apiKey, defaultInstructions } = getPreferences();
  
  const finalInstructions = instructions || defaultInstructions || undefined;

  const response = await fetch("https://api.mem.ai/v2/mem-it", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: content,
      ...(finalInstructions && { instructions: finalInstructions }),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mem API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Create a simple mem (note) without AI processing
 * Uses the v0 API endpoint
 */
export async function createMem(content: string): Promise<CreateMemResponse> {
  const { apiKey } = getPreferences();

  const response = await fetch("https://api.mem.ai/v0/mems", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `ApiAccessToken ${apiKey}`,
    },
    body: JSON.stringify({
      content,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mem API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Append content to an existing mem
 */
export async function appendToMem(
  memId: string,
  content: string
): Promise<void> {
  const { apiKey } = getPreferences();

  const response = await fetch(`https://api.mem.ai/v0/mems/${memId}/append`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `ApiAccessToken ${apiKey}`,
    },
    body: JSON.stringify({
      content,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mem API error: ${response.status} - ${errorText}`);
  }
}
