import { getSelectedText, showHUD, showToast, Toast } from "@raycast/api";
import { memIt, getPreferences } from "./lib/mem-api";

export default async function CaptureSelection() {
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

  try {
    // Get selected text
    const selectedText = await getSelectedText();

    if (!selectedText || !selectedText.trim()) {
      await showHUD("❌ Aucun texte sélectionné");
      return;
    }

    await showHUD("📤 Envoi vers Mem...");
    
    await memIt(selectedText);
    
    await showHUD("✨ Sélection sauvegardée dans Mem !");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    
    // Handle specific error for no selection
    if (errorMessage.includes("Unable to get selected text")) {
      await showHUD("❌ Sélectionne du texte d'abord");
      return;
    }
    
    await showHUD(`❌ Erreur: ${errorMessage}`);
  }
}
