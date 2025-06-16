import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";
import { useCurrentUser } from "./use-current-user";

export function useCanUseModel() {
  const { data: user } = useCurrentUser();
  const models = useQuery(api.models.list);
  const selectedModel = models?.find((m) => m._id === user?.model);

  return !selectedModel?.isPremium || user?.isPremium;
}
