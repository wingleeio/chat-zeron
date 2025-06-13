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
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { Fragment } from "react/jsx-runtime";
import { match, P } from "ts-pattern";

export const Route = createFileRoute("/c/$cid")({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    context.convexQueryClient.serverHttpClient?.setAuth(context.token ?? "");
    const [chat, messages] = await Promise.all([
      context.queryClient.fetchQuery(
        convexQuery(api.chats.getById, {
          id: params.cid as Id<"chats">,
        })
      ),
      context.queryClient.fetchQuery(
        convexQuery(api.messages.list, {
          chatId: params.cid as Id<"chats">,
        })
      ),
    ]);
    return { chat, messages };
  },
});

function RouteComponent() {
  const { cid } = Route.useParams();
  const { data } = useSuspenseQuery(
    convexQuery(api.messages.list, {
      chatId: cid as Id<"chats">,
    })
  );
  const loaderData = Route.useLoaderData();

  const messages = data.length > 0 ? data : loaderData.messages;

  return (
    <Fragment key={cid}>
      <ChatContainerRoot
        className="w-full flex-1"
        initial="instant"
        resize="smooth"
      >
        <ChatContainerContent className="gap-4 px-4 pt-32 pb-16 mx-auto max-w-3xl">
          {messages.map((message) => (
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
      </ChatContainerRoot>
      <div className="w-full px-4 pb-4">
        <PromptInputWithActions />
      </div>
    </Fragment>
  );
}
