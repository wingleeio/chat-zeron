import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";

export function useModels() {
  return useSuspenseQuery(convexQuery(api.models.list, {}));
}
