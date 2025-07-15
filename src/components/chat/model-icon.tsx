import * as React from "react";
import type { SVGProps } from "react";
import AnthropicIcon from "../icons/anthropic";
import ClaudeIcon from "../icons/claude";
import DeepseekIcon from "../icons/deepseek";
import GeminiIcon from "../icons/gemini";
import GoogleIcon from "../icons/google";
import GrokIcon from "../icons/grok";
import MetaIcon from "../icons/meta";
import MoonshotIcon from "../icons/moonshot";
import MistralIcon from "../icons/mistral";
import OllamaIcon from "../icons/ollama";
import OpenAIIcon from "../icons/openai";
import OpenRouterIcon from "../icons/openrouter";
import XIcon from "../icons/x";
import XAIIcon from "../icons/xai";

export type ModelType =
  | "anthropic"
  | "claude"
  | "deepseek"
  | "gemini"
  | "google"
  | "grok"
  | "meta"
  | "moonshot"
  | "mistral"
  | "ollama"
  | "openai"
  | "openrouter"
  | "x"
  | "xai";

interface ModelIconProps extends SVGProps<SVGSVGElement> {
  model: ModelType;
}

const ModelIcon = ({ model, ...props }: ModelIconProps) => {
  const icons: Record<
    ModelType,
    React.ComponentType<SVGProps<SVGSVGElement>>
  > = {
    anthropic: AnthropicIcon,
    claude: ClaudeIcon,
    deepseek: DeepseekIcon,
    gemini: GeminiIcon,
    google: GoogleIcon,
    grok: GrokIcon,
    meta: MetaIcon,
    moonshot: MoonshotIcon,
    mistral: MistralIcon,
    ollama: OllamaIcon,
    openai: OpenAIIcon,
    openrouter: OpenRouterIcon,
    x: XIcon,
    xai: XAIIcon,
  };

  const Icon = icons[model];

  return <Icon {...props} />;
};

export default ModelIcon;
