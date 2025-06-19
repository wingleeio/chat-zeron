import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

export function ChatPreloader({ id }: { id: Id<"chats"> }) {
  useQuery(convexQuery(api.chats.getById, { id }));
  return null;
}
