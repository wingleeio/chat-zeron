import type { Capability } from "convex/ai/provider";
import { useModels } from "./use-models";
import { useCurrentUser } from "@/hooks/use-current-user";

export function useModelSupports(capability: Capability) {
  const { data: user } = useCurrentUser();
  const { data: models } = useModels();
  const selectedModel = models?.find((m) => m._id === user?.model);

  return selectedModel?.capabilities?.includes(capability) ?? false;
}
