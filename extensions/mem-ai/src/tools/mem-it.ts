import { memIt } from "../lib/mem-api";
import { Tool } from "@raycast/api";

type Input = {
  /**
   * The content to send to Mem for intelligent processing.
   * Mem AI will automatically organize, tag, link, and structure this content.
   */
  content: string;

  /**
   * Optional instructions for Mem AI on how to process the content.
   * Examples: "File under Projects", "Summarize and extract key points", "Tag as #meeting-notes"
   */
  instructions?: string;
};

/**
 * Confirmation before saving to Mem
 */
export const confirmation: Tool.Confirmation<Input> = async (input) => {
  return {
    message: `Sauvegarder dans Mem avec traitement IA?`,
    info: [
      {
        name: "Contenu",
        value: input.content.length > 150 
          ? input.content.substring(0, 150) + "..." 
          : input.content,
      },
      ...(input.instructions 
        ? [{ name: "Instructions", value: input.instructions }] 
        : []),
    ],
  };
};

/**
 * Send content to Mem with AI processing.
 * Mem will automatically organize, tag, link, and structure the content intelligently.
 * Use this for content that benefits from AI organization.
 */
export default async function tool(input: Input): Promise<string> {
  try {
    const result = await memIt(input.content, input.instructions);
    
    let response = `✨ Contenu sauvegardé et traité par Mem AI!\n\n`;
    response += `📝 Aperçu: "${input.content.substring(0, 100)}${input.content.length > 100 ? '...' : ''}"}`;
    
    if (input.instructions) {
      response += `\n\n🎯 Instructions appliquées: "${input.instructions}"`;
    }
    
    response += `\n\nMem a automatiquement organisé et structuré ce contenu dans ta base de connaissances.`;
    
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    return `❌ Erreur lors de l'envoi à Mem: ${errorMessage}`;
  }
}
