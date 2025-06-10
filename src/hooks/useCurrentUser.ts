import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";

export function useCurrentUser() {
  return useSuspenseQuery(convexQuery(api.users.getCurrent, {}));
}
