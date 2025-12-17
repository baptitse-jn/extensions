import { Clipboard, showHUD, showToast, Toast } from "@raycast/api";
import { memIt, getPreferences } from "./lib/mem-api";

export default async function CaptureClipboard() {
  // Check API key
  const { apiKey } = getPreferences();
  if (!apiKey) {
    await showToast({
      style: Toast.Style.Failure,
      title: "API Key manquante",
      message: "Configure ta clé API Mem dans les préférences",
    });
    return;
  }

  // Get clipboard content
  const clipboardContent = await Clipboard.readText();

  if (!clipboardContent || !clipboardContent.trim()) {
    await showHUD("❌ Presse-papier vide");
    return;
  }

  try {
    await showHUD("📤 Envoi vers Mem...");
    
    await memIt(clipboardContent);
    
    await showHUD("✨ Sauvegardé dans Mem !");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    await showHUD(`❌ Erreur: ${errorMessage}`);
  }
}
