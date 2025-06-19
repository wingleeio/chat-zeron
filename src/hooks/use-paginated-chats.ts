import { usePaginatedQuery } from "convex/react";

import { api } from "convex/_generated/api";

export function usePaginatedChats() {
  return usePaginatedQuery(api.chats.getPaginated, {}, { initialNumItems: 20 });
}

export function PaginatedChatsPreloader() {
  usePaginatedChats();
  return null;
}
