import {
  Form,
  ActionPanel,
  Action,
  showToast,
  Toast,
  getPreferenceValues,
  popToRoot,
} from "@raycast/api";
import { useState } from "react";

interface Preferences {
  apiKey: string;
}

interface FormValues {
  content: string;
  useAI: boolean;
  instructions?: string;
}

export default function QuickCapture() {
  const [isLoading, setIsLoading] = useState(false);
  const { apiKey } = getPreferenceValues<Preferences>();

  async function handleSubmit(values: FormValues) {
    if (!values.content.trim()) {
      showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: "Content cannot be empty",
      });
      return;
    }

    setIsLoading(true);

    try {
      let response;

      if (values.useAI) {
        // Use Mem It API (v2) with AI
        response = await fetch("https://api.mem.ai/v2/mem-it", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `ApiAccessToken ${apiKey}`,
          },
          body: JSON.stringify({
            content: values.content,
            instructions: values.instructions || undefined,
          }),
        });
      } else {
        // Use simple API (v0) without AI
        response = await fetch("https://api.mem.ai/v0/mems", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `ApiAccessToken ${apiKey}`,
          },
          body: JSON.stringify({
            content: values.content,
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorData}`);
      }

      showToast({
        style: Toast.Style.Success,
        title: "Success",
        message: values.useAI ? "Note saved with AI processing" : "Note saved to Mem",
      });

      popToRoot();
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to save note",
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
          <Action.SubmitForm title="Save to Mem" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextArea
        id="content"
        title="Content"
        placeholder="Write your note here..."
        enableMarkdown
      />
      <Form.Checkbox
        id="useAI"
        label="Use AI Processing"
        info="Mem AI will automatically organize and link your note"
        defaultValue={true}
      />
      <Form.TextField
        id="instructions"
        title="Instructions (optional)"
        placeholder="e.g., Add to my reading list"
        info="Specific instructions for Mem AI"
      />
    </Form>
  );
}
