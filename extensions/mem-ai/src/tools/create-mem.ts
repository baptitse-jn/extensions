import { createMem } from "../lib/mem-api";

type Input = {
  /**
   * The content of the note to save in Mem.
   * This can be any text: ideas, notes, information, links, etc.
   */
  content: string;
};

/**
 * Create a new note in Mem.
 * Use this tool to save simple notes, ideas, or information to the user's Mem knowledge base.
 */
export default async function tool(input: Input): Promise<string> {
  try {
    const result = await createMem(input.content);
    
    return `✅ Note créée dans Mem avec succès!\n\nContenu sauvegardé:\n"${input.content.substring(0, 100)}${input.content.length > 100 ? '...' : ''}"`;  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    return `❌ Erreur lors de la création de la note: ${errorMessage}`;
  }
}
