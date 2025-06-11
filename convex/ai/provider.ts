import { customProvider } from "ai";
import { azure } from "@ai-sdk/azure";
import { openrouter } from "@openrouter/ai-sdk-provider";

export const provider = customProvider({
  languageModels: {
    // GPT models
    "gpt-4o": azure("gpt-4o"),
    "gpt-4o-mini": azure("gpt-4o-mini"),

    // Gemini models
    "gemini-2.5-flash": openrouter("google/gemini-2.5-flash-preview-05-20"),

    // Claude models
    "claude-sonnet-4": openrouter("anthropic/claude-3.7-sonnet:thinking", {
      extraBody: {
        reasoning: {
          enabled: true,
        },
      },
    }),

    // Deepseek models
    "deepseek-r1": openrouter("deepseek/deepseek-r1-0528:free", {
      extraBody: {
        reasoning: {
          enabled: true,
        },
      },
    }),
  },
});
