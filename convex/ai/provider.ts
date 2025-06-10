import { customProvider } from "ai";
import { azure } from "@ai-sdk/azure";

export const provider = customProvider({
  languageModels: {
    // GPT models
    "gpt-4o": azure("gpt-4o"),
    "gpt-4o-mini": azure("gpt-4o-mini"),
  },
});
