import { useCurrentUser } from "./use-current-user";
import { useModels } from "./use-models";

export function useCanUseModel() {
  const { data: user } = useCurrentUser();
  const { data: models } = useModels();
  const selectedModel = models?.find((m) => m._id === user?.model);

  return !selectedModel?.isPremium || user?.isPremium;
}
