import { useNavigate, useParams } from "@tanstack/react-router";

import { convexQuery } from "@convex-dev/react-query";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import type { Doc } from "convex/_generated/dataModel";
import type { MessageWithUIMessages } from "convex/messages";
import { useAuth } from "@clerk/tanstack-start";
import { env } from "@/env.client";
import { parseRawTextIntoUIMessages } from "@/lib/utils";
import { useInput, useFiles } from "@/stores/chat";
import type {
  StreamBody,
  StreamId,
} from "@convex-dev/persistent-text-streaming";
import { v4 } from "uuid";
import { useCurrentUser } from "./use-current-user";

export function useChatByParamId(): Doc<"chats"> | null {
  const params = useParams({ from: "/c/$cid", shouldThrow: false });

  const shouldSkip = !params?.cid;
  const args = shouldSkip ? "skip" : { clientId: params?.cid };

  const chatQuery = convexQuery(api.chats.getById, args);

  const { data } = useQuery(chatQuery);

  return data ?? null;
}

export function useMessageByParamId(): MessageWithUIMessages[] {
  const params = useParams({ from: "/c/$cid", shouldThrow: false });

  const shouldSkip = !params?.cid;
  const args = shouldSkip ? "skip" : { clientId: params?.cid };

  const messageQuery = convexQuery(api.messages.list, args);

  const { data } = useQuery(messageQuery);

  return data ?? [];
}

export function useSendMessageByParamId() {
  const auth = useAuth();
  const { data: me } = useCurrentUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const chat = useChatByParamId();
  const [_, setInput] = useInput();
  const [__, setFiles] = useFiles();
  const params = useParams({ from: "/c/$cid", shouldThrow: false });

  return useMutation({
    mutationFn: async ({
      chatId,
      messageId,
      prompt,
      tool,
      files,
    }: {
      chatId: string;
      messageId: string;
      prompt: string;
      tool?: "search" | "research" | "image" | undefined;
      files?: string[];
    }) => {
      const response = await fetch(`${env.VITE_CONVEX_SITE_URL}/stream`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await auth.getToken({ template: "convex" })}`,
        },
        body: JSON.stringify({
          chatClientId: chatId,
          messageClientId: messageId,
          prompt,
          tool,
          files,
        }),
      });

      let text = "";
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No reader");
      }
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        text += new TextDecoder().decode(value);
        const uiMessages = parseRawTextIntoUIMessages(text);

        queryClient.setQueryData(
          convexQuery(api.messages.list, {
            clientId: chatId,
          }).queryKey,
          (old: Doc<"messages">[]) => {
            const newMessages = old.map((m) => {
              if (m.clientId === messageId) {
                return {
                  ...m,
                  uiMessages,
                };
              }
              return m;
            });

            return newMessages;
          }
        );
      }
    },
    onMutate: async ({ chatId, messageId, prompt, files }) => {
      const actualChatId = chat?._id ?? chatId;

      queryClient.setQueryData(
        convexQuery(api.messages.list, {
          clientId: chatId,
        }).queryKey,
        (old: Doc<"messages">[]) => {
          const prev = old ?? [];
          const existingMessage = prev.find((m) => m.clientId === messageId);
          if (existingMessage?.responseStreamId) {
            queryClient.setQueryData(
              convexQuery(api.streaming.getStreamBody, {
                streamId: existingMessage.responseStreamId as StreamId,
              }).queryKey,
              (_: StreamBody) => {
                return {
                  text: "",
                  status: "pending",
                };
              }
            );
          }
          return [
            ...prev
              .filter((m) => m.clientId !== messageId)
              .filter(
                (m) =>
                  m._creationTime <=
                  (existingMessage?._creationTime ?? Date.now())
              ),
            {
              ...existingMessage,
              _id: existingMessage?._id || messageId,
              responseStreamStatus: "pending",
              clientId: messageId,
              prompt,
              files,
              _creationTime: existingMessage?._creationTime ?? Date.now(),
              uiMessages: [
                {
                  id: v4(),
                  content: null,
                  parts: [],
                },
              ],
            },
          ];
        }
      );
      queryClient.setQueryData(
        convexQuery(api.chats.getById, {
          clientId: chatId,
        }).queryKey,
        (old: Doc<"chats">) => {
          const prev = old ?? {
            _id: actualChatId,
            clientId: chatId,
            userId: me?._id,
          };
          return {
            ...prev,
            status: "submitted",
          };
        }
      );
      setInput("");
      setFiles([]);
      if (!params?.cid) {
        await navigate({
          to: "/c/$cid",
          params: { cid: chatId },
          replace: true,
        });
      }
    },
  });
}
