import { useParams } from "@tanstack/react-router";

import { convexQuery } from "@convex-dev/react-query";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import type { Doc, Id } from "convex/_generated/dataModel";
import type { MessageWithUIMessages } from "convex/messages";

export function useChatByParamId(): Doc<"chats"> | null {
  const params = useParams({ from: "/c/$cid", shouldThrow: false });
  const queryClient = useQueryClient();

  const shouldSkip = !params || params.cid.startsWith("tmp-");
  const args = shouldSkip ? "skip" : { id: params?.cid as Id<"chats"> };

  const chatQuery = convexQuery(api.chats.getById, args);

  const { data } = useQuery(chatQuery);

  if (shouldSkip) {
    const cachedChat = queryClient.getQueryData(
      convexQuery(api.chats.getById, {
        id: params?.cid as Id<"chats">,
      }).queryKey
    );
    return (cachedChat as Doc<"chats"> | null) ?? null;
  }

  return data ?? null;
}

export function useMessageByParamId(): MessageWithUIMessages[] {
  const params = useParams({ from: "/c/$cid", shouldThrow: false });
  const queryClient = useQueryClient();

  const shouldSkip = !params || params.cid.startsWith("tmp-");
  const args = shouldSkip ? "skip" : { chatId: params?.cid as Id<"chats"> };

  const messageQuery = convexQuery(api.messages.list, args);

  const { data } = useQuery(messageQuery);

  if (shouldSkip) {
    const cachedMessage = queryClient.getQueryData(
      convexQuery(api.messages.list, {
        chatId: params?.cid as Id<"chats">,
      }).queryKey
    );
    return (cachedMessage as MessageWithUIMessages[]) ?? [];
  }

  return data ?? [];
}
