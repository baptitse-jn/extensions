import { getSelectedText, showToast, Toast, getPreferenceValues, showHUD } from "@raycast/api";

interface Preferences {
  apiKey: string;
}

export default async function CaptureSelection() {
  const { apiKey } = getPreferenceValues<Preferences>();

  try {
    const selectedText = await getSelectedText();

    if (!selectedText || !selectedText.trim()) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: "No text selected",
      });
      return;
    }

    const response = await fetch("https://api.mem.ai/v2/mem-it", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `ApiAccessToken ${apiKey}`,
      },
      body: JSON.stringify({
        content: selectedText,
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    await showHUD("✅ Selection saved to Mem");
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Error",
      message: error instanceof Error ? error.message : "Unable to capture selection",
    });
  }
}
