import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Capability } from "convex/ai/provider";

export function useModelSupports(capability: Capability) {
  const models = useQuery(api.models.list);
  const user = useQuery(api.auth.current);
  const selectedModel = models?.find((m) => m._id === user?.model);

  return selectedModel?.capabilities?.includes(capability) ?? false;
}
