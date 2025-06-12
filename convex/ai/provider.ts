import { azure } from "@ai-sdk/azure";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { v, type Infer } from "convex/values";
import { match } from "ts-pattern";

export const models = [
  {
    name: "DeepSeek V3",
    model: "deepseek/deepseek-chat-v3-0324:free",
    provider: "openrouter",
    icon: "deepseek",
  },
  {
    name: "DeepSeek R1",
    model: "deepseek/deepseek-r1-0528:free",
    provider: "openrouter",
    icon: "deepseek",
  },
  {
    name: "Claude Sonnet 4",
    model: "anthropic/claude-3.7-sonnet:thinking",
    provider: "openrouter",
    icon: "anthropic",
  },
  {
    name: "Claude Opus 4",
    model: "anthropic/claude-opus-4",
    provider: "openrouter",
    icon: "anthropic",
  },
  {
    name: "Gemini 2.0 Flash",
    model: "google/gemini-2.0-flash-001",
    provider: "openrouter",
    icon: "gemini",
  },
  {
    name: "Gemini 2.5 Flash",
    model: "google/gemini-2.5-flash-preview-05-20",
    provider: "openrouter",
    icon: "gemini",
  },
  {
    name: "Gemini 2.5 Pro",
    model: "google/gemini-2.5-pro-preview",
    provider: "openrouter",
    icon: "gemini",
  },
  {
    name: "GPT 4o",
    model: "gpt-4o",
    provider: "azure",
    icon: "openai",
  },
  {
    name: "GPT 4o-mini",
    model: "gpt-4o-mini",
    provider: "azure",
    icon: "openai",
  },
  {
    name: "GPT 4.1",
    model: "gpt-4.1",
    provider: "azure",
    icon: "openai",
  },
  {
    name: "GPT 4.1-mini",
    model: "gpt-4.1-mini",
    provider: "azure",
    icon: "openai",
  },
  {
    name: "o4-mini",
    model: "o4-mini",
    provider: "azure",
    icon: "openai",
  },
] as const;

export const vModel = v.union(...models.map((m) => v.literal(m.model)));
export const vProvider = v.union(v.literal("azure"), v.literal("openrouter"));

export function getModel(
  provider: Infer<typeof vProvider>,
  model: Infer<typeof vModel>
) {
  return match(provider)
    .with("azure", () => {
      return azure(model);
    })
    .with("openrouter", () => {
      return openrouter(model);
    })
    .exhaustive();
}
