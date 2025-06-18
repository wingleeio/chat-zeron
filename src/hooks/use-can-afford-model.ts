import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";
import { useCurrentUser } from "./use-current-user";
import { FREE_CREDITS } from "@/lib/constants";
import {
  PRO_CREDITS,
  IMAGE_GENERATION_COST,
  SEARCH_COST,
  RESEARCH_COST,
} from "@/lib/constants";
import { useTool } from "@/stores/chat";
import { match, P } from "ts-pattern";

export function useCanAffordModel() {
  const tool = useTool();
  const { data: user } = useCurrentUser();
  const maxCredits = user?.isPremium ? PRO_CREDITS : FREE_CREDITS;
  const models = useQuery(api.models.list);
  const selectedModel = models?.find((m) => m._id === user?.model);
  const toolCost = match(tool)
    .with("image", () => IMAGE_GENERATION_COST)
    .with("search", () => SEARCH_COST)
    .with("research", () => RESEARCH_COST)
    .with(P.nullish, () => 0)
    .exhaustive();
  const totalCost = (selectedModel?.cost ?? 0) + toolCost;

  if (totalCost === 0) {
    return true;
  }

  return maxCredits - (user?.creditsUsed ?? 0) >= totalCost;
}
