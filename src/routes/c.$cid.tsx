import { AppHeader } from "@/components/app/header";
import {
  ChatContainerContent,
  ChatContainerRoot,
} from "@/components/chat/container";
import {
  CompletedServerMessage,
  PendingServerMessage,
  StreamingServerMessage,
  UserMessage,
} from "@/components/chat/message";
import { PromptInputWithActions } from "@/components/chat/prompt-input";
import { ScrollButton } from "@/components/chat/scroll-button";
import { convexQuery } from "@convex-dev/react-query";

import { createFileRoute } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { ChevronDownIcon } from "lucide-react";
import { Fragment } from "react/jsx-runtime";
import { match, P } from "ts-pattern";
import {
  useChatByParamId,
  useMessageByParamId,
} from "@/hooks/use-chat-by-param-id";
import { useCurrentUser } from "@/hooks/use-current-user";

export const Route = createFileRoute("/c/$cid")({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    if (params.cid.startsWith("tmp-") || !params.cid) {
      return { chat: null };
    }
    const chat = await context.queryClient.fetchQuery(
      convexQuery(api.chats.getById, {
        id: params.cid as Id<"chats">,
      })
    );
    await context.queryClient.ensureQueryData(
      convexQuery(api.messages.list, {
        chatId: params.cid as Id<"chats">,
      })
    );
    return { chat };
  },
  head: ({ loaderData }) => {
    return {
      meta: [
        {
          title: `${loaderData?.chat?.title ? `${loaderData.chat.title} | ` : ""} Zeron`,
        },
        {
          property: "og:title",
          content: `${loaderData?.chat?.title} | Zeron`,
        },
        {
          property: "og:type",
          content: "article",
        },
        {
          property: "og:description",
          content: `${loaderData?.chat?.isPublic ? "A user has shared a chat with you" : ""}`,
        },
        {
          property: "og:site_name",
          content: "Zeron",
        },
      ],
    };
  },
});

function RouteComponent() {
  const loaderData = Route.useLoaderData();
  const { cid } = Route.useParams();
  const chat = useChatByParamId() || loaderData?.chat;
  const messages = useMessageByParamId();
  const { data: me } = useCurrentUser();

  return (
    <Fragment key={cid}>
      <AppHeader />
      <ChatContainerRoot
        className="w-full flex-1 flex-col overflow-x-hidden"
        initial="instant"
        resize="smooth"
      >
        <ChatContainerContent className="gap-4 px-4 pt-32 pb-16 mx-auto max-w-3xl">
          {messages?.map((message) => (
            <Fragment key={message._id}>
              <UserMessage message={message} />
              {match(message)
                .with(
                  {
                    responseStreamStatus: P.union("done", "error", "timeout"),
                    responseStreamContent: P.string,
                  },
                  () => <CompletedServerMessage message={message} />
                )
                .with(
                  {
                    responseStreamId: P.string,
                    responseStreamStatus: P.union("streaming", "pending"),
                  },
                  () => <StreamingServerMessage message={message} />
                )
                .otherwise(() => (
                  <PendingServerMessage />
                ))}
            </Fragment>
          ))}
        </ChatContainerContent>

        <div className="w-full md:px-4 md:pb-4 relative">
          <div className="absolute -top-10 left-[50%] -translate-x-1/2">
            <ScrollButton variant="default">
              <span className="text-xs">Scroll to bottom</span>
              <ChevronDownIcon className="size-3" />
            </ScrollButton>
          </div>
          {me?._id === chat?.userId && <PromptInputWithActions />}
        </div>
      </ChatContainerRoot>
    </Fragment>
  );
}
