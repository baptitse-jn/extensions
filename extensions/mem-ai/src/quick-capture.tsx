import {
  Action,
  ActionPanel,
  Form,
  showToast,
  Toast,
  popToRoot,
  openExtensionPreferences,
} from "@raycast/api";
import { useState } from "react";
import { memIt, createMem, getPreferences } from "./lib/mem-api";

export default function QuickCapture() {
  const [content, setContent] = useState("");
  const [instructions, setInstructions] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [useAI, setUseAI] = useState(true);

  async function handleSubmit() {
    if (!content.trim()) {
      showToast({
        style: Toast.Style.Failure,
        title: "Contenu vide",
        message: "Entre du contenu à sauvegarder",
      });
      return;
    }

    // Check API key
    const { apiKey } = getPreferences();
    if (!apiKey) {
      showToast({
        style: Toast.Style.Failure,
        title: "API Key manquante",
        message: "Configure ta clé API Mem dans les préférences",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (useAI) {
        const result = await memIt(content, instructions || undefined);
        showToast({
          style: Toast.Style.Success,
          title: "✨ Sauvegardé dans Mem",
          message: "Contenu traité par l'IA et organisé",
        });
      } else {
        await createMem(content);
        showToast({
          style: Toast.Style.Success,
          title: "📝 Note créée",
          message: "Contenu sauvegardé dans Mem",
        });
      }
      popToRoot();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      showToast({
        style: Toast.Style.Failure,
        title: "Erreur",
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Sauvegarder dans Mem"
            onSubmit={handleSubmit}
          />
          <Action
            title="Ouvrir les préférences"
            onAction={openExtensionPreferences}
            shortcut={{ modifiers: ["cmd"], key: "," }}
          />
        </ActionPanel>
      }
    >
      <Form.TextArea
        id="content"
        title="Contenu"
        placeholder="Écris ta note, idée, ou information à sauvegarder..."
        value={content}
        onChange={setContent}
        enableMarkdown
      />

      <Form.Separator />

      <Form.Checkbox
        id="useAI"
        label="Utiliser l'IA Mem"
        info="L'IA organisera, taguera et structurera automatiquement ton contenu"
        value={useAI}
        onChange={setUseAI}
      />

      {useAI && (
        <Form.TextField
          id="instructions"
          title="Instructions IA (optionnel)"
          placeholder="Ex: Classe sous 'Projets/My Wai' et résume"
          value={instructions}
          onChange={setInstructions}
        />
      )}

      <Form.Description
        title="💡 Astuce"
        text="Active 'Utiliser l'IA Mem' pour que Mem organise automatiquement tes notes avec des tags, des liens et une structure intelligente."
      />
    </Form>
  );
}
