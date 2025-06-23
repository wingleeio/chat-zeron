import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";

export function ChatPreloader({ clientId }: { clientId: string }) {
  useQuery(convexQuery(api.chats.getById, { clientId }));
  useQuery(convexQuery(api.messages.list, { clientId }));
  return null;
}
