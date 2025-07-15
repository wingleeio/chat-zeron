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
    capabilities: ["tools"] as Infer<typeof vCapabilities>[],
    description: "Smaller model by DeepSeek with fewer capabilities.",
    isPremium: false,
    isDisabled: false,
    cost: 0,
  },
  {
    name: "DeepSeek R1",
    model: "deepseek/deepseek-r1-0528:free",
    provider: "openrouter",
    icon: "deepseek",
    capabilities: ["thinking"] as Infer<typeof vCapabilities>[],
    description: "Flagship model by DeepSeek.",
    isPremium: false,
    isDisabled: false,
    cost: 0,
  },
  {
    name: "Claude Sonnet 3.7",
    model: "anthropic/claude-3.7-sonnet:thinking",
    provider: "openrouter",
    icon: "anthropic",
    capabilities: ["thinking", "vision", "tools"] as Infer<
      typeof vCapabilities
    >[],
    description: "Sonnet 3.7 model by Anthropic.",
    isPremium: true,
    isDisabled: false,
    cost: 5,
  },
  {
    name: "Claude Sonnet 4",
    model: "anthropic/claude-4-sonnet-20250522",
    provider: "openrouter",
    icon: "anthropic",
    capabilities: ["thinking", "vision", "tools"] as Infer<
      typeof vCapabilities
    >[],
    description: "Latest Sonnet model by Anthropic.",
    isPremium: true,
    isDisabled: false,
    cost: 5,
  },
  {
    name: "Claude Opus 4",
    model: "anthropic/claude-opus-4",
    provider: "openrouter",
    icon: "anthropic",
    capabilities: ["thinking", "vision", "tools"] as Infer<
      typeof vCapabilities
    >[],
    description: "Latest Opus model by Anthropic.",
    isPremium: true,
    isDisabled: true,
    cost: 20,
  },
  {
    name: "Gemini 2.0 Flash",
    model: "google/gemini-2.0-flash-001",
    provider: "openrouter",
    icon: "gemini",
    capabilities: ["vision", "tools"] as Infer<typeof vCapabilities>[],
    description: "Fast model tuned for low latency.",
    isPremium: false,
    isDisabled: false,
    cost: 0,
  },
  {
    name: "Gemini 2.5 Flash",
    model: "google/gemini-2.5-flash-preview-05-20",
    provider: "openrouter",
    icon: "gemini",
    capabilities: ["vision", "tools"] as Infer<typeof vCapabilities>[],
    description:
      "Preview of next generation Gemini Flash with more capabilities.",
    isPremium: false,
    isDisabled: false,
    cost: 0,
  },
  {
    name: "Gemini 2.5 Flash Lite",
    model: "google/gemini-2.5-flash-lite-preview-06-17",
    provider: "openrouter",
    icon: "gemini",
    capabilities: ["thinking", "vision", "tools"] as Infer<
      typeof vCapabilities
    >[],
    description:
      "Lightweight reasoning model, with faster token generation than other Gemini models.",
    isPremium: false,
    isDisabled: false,
    cost: 0,
  },
  {
    name: "Gemini 2.5 Flash (Thinking)",
    model: "google/gemini-2.5-flash-preview-05-20:thinking",
    provider: "openrouter",
    icon: "gemini",
    capabilities: ["thinking", "vision", "tools"] as Infer<
      typeof vCapabilities
    >[],
    description:
      "Preview of next generation Gemini Flash with more capabilities and reasoning.",
    isPremium: false,
    isDisabled: false,
    cost: 0,
  },
  {
    name: "Gemini 2.5 Pro",
    model: "google/gemini-2.5-pro-preview",
    provider: "openrouter",
    icon: "gemini",
    capabilities: ["thinking", "vision", "tools"] as Infer<
      typeof vCapabilities
    >[],
    description:
      "Preview of latest Pro model by Gemini with more capabilities.",
    isPremium: true,
    isDisabled: false,
    cost: 5,
  },
  {
    name: "GPT 4o",
    model: "gpt-4o",
    provider: "azure",
    icon: "openai",
    capabilities: ["vision", "tools"] as Infer<typeof vCapabilities>[],
    description:
      "Second largest chat model from OpenAI, great for most questions.",
    isPremium: true,
    isDisabled: false,
    cost: 2,
  },
  {
    name: "GPT 4o-mini",
    model: "gpt-4o-mini",
    provider: "azure",
    icon: "openai",
    capabilities: ["vision", "tools"] as Infer<typeof vCapabilities>[],
    description: "Faster, less accurate version of GPT-4o.",
    isPremium: false,
    isDisabled: false,
    cost: 0,
  },
  {
    name: "GPT 4.1",
    model: "gpt-4.1",
    provider: "azure",
    icon: "openai",
    capabilities: ["vision", "tools"] as Infer<typeof vCapabilities>[],
    description: "Model from OpenAI tuned for coding tasks.",
    isPremium: true,
    isDisabled: false,
    cost: 2,
  },
  {
    name: "GPT 4.1 Nano",
    model: "gpt-4.1-mini",
    provider: "azure",
    icon: "openai",
    capabilities: ["vision", "tools"] as Infer<typeof vCapabilities>[],
    description: "Faster, less accurate version of GPT-4.1.",
    isPremium: false,
    isDisabled: false,
    cost: 0,
  },
  {
    name: "o4-mini",
    model: "o4-mini",
    provider: "azure",
    icon: "openai",
    capabilities: ["thinking", "vision", "tools"] as Infer<
      typeof vCapabilities
    >[],
    description: "Smaller, faster version of o4.",
    isPremium: true,
    isDisabled: false,
    cost: 1,
  },
  {
    name: "Grok 3 Beta",
    model: "x-ai/grok-3-beta",
    provider: "openrouter",
    icon: "xai",
    capabilities: ["thinking", "vision", "tools"] as Infer<
      typeof vCapabilities
    >[],
    description: "Grok 3 Beta model by xAI.",
    isPremium: true,
    isDisabled: false,
    cost: 5,
  },
  {
    name: "Grok 3 Mini Beta",
    model: "x-ai/grok-3-mini-beta",
    provider: "openrouter",
    icon: "xai",
    capabilities: ["thinking", "vision", "tools"] as Infer<
      typeof vCapabilities
    >[],
    description: "Grok 3 Mini Beta model by xAI.",
    isPremium: true,
    isDisabled: false,
    cost: 0,
  },
  {
    name: "Kimi K2",
    model: "moonshotai/kimi-k2-instruct",
    provider: "openrouter",
    icon: "openrouter",
    capabilities: ["vision", "tools"] as Infer<typeof vCapabilities>[],
    description:
      "Kimi K2 is a large-scale Mixture-of-Experts (MoE) language model developed by Moonshot AI",
    isPremium: true,
    isDisabled: false,
    cost: 0,
  },
] as const;

export const vModel = v.union(...models.map((m) => v.literal(m.model)));
export const vProvider = v.union(v.literal("azure"), v.literal("openrouter"));
export const vCapabilities = v.union(
  v.literal("vision"),
  v.literal("tools"),
  v.literal("thinking")
);

export type Model = Infer<typeof vModel>;
export type Provider = Infer<typeof vProvider>;
export type Capability = Infer<typeof vCapabilities>;

export function getModel(
  provider: Infer<typeof vProvider>,
  model: Infer<typeof vModel>
) {
  return match(provider)
    .with("azure", () => {
      return azure(model, {
        parallelToolCalls: false,
      });
    })
    .with("openrouter", () => {
      return match(model)
        .with("anthropic/claude-4-sonnet-20250522", () => {
          return openrouter(model, {
            parallelToolCalls: false,
            extraBody: {
              reasoning: {
                enabled: true,
              },
            },
          });
        })
        .with("moonshotai/kimi-k2-instruct", () => {
          return openrouter(model, {
            parallelToolCalls: false,
            extraBody: {
              provider: {
                only: ["groq"],
              },
            },
          });
        })
        .otherwise(() => {
          return openrouter(model);
        });
    })
    .exhaustive();
}
