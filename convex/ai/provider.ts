import { customProvider } from "ai";
import { azure } from "@ai-sdk/azure";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { v } from "convex/values";

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

export const models = [
  {
    name: "DeepSeek R1",
    model: "deepseek/deepseek-r1-0528:free",
    provider: "openrouter",
  },
  {
    name: "Claude Sonnet 4",
    model: "anthropic/claude-3.7-sonnet:thinking",
    provider: "openrouter",
  },
  {
    name: "Gemini 2.5 Flash",
    model: "google/gemini-2.5-flash-preview-05-20",
    provider: "openrouter",
  },
  {
    name: "GPT 4o",
    model: "azure/gpt-4o",
    provider: "azure",
  },
  {
    name: "GPT 4o-mini",
    model: "azure/gpt-4o-mini",
    provider: "azure",
  },
] as const;

export const vModel = v.union(...models.map((m) => v.literal(m.model)));
export const vProvider = v.union(v.literal("azure"), v.literal("openrouter"));
