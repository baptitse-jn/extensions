import { Clipboard, showToast, Toast, getPreferenceValues, showHUD } from "@raycast/api";

interface Preferences {
  apiKey: string;
}

export default async function CaptureClipboard() {
  const { apiKey } = getPreferenceValues<Preferences>();

  try {
    const clipboardContent = await Clipboard.readText();

    if (!clipboardContent || !clipboardContent.trim()) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: "Clipboard is empty",
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
        content: clipboardContent,
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    await showHUD("✅ Clipboard saved to Mem");
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Error",
      message: error instanceof Error ? error.message : "Failed to save",
    });
  }
}
