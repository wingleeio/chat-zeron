import {
  ChatContainerContent,
  ChatContainerRoot,
} from "@/components/chat/container";
import { ServerMessage, UserMessage } from "@/components/chat/message";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { Fragment } from "react/jsx-runtime";

export const Route = createFileRoute("/c/$cid")({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      convexQuery(api.messages.list, {
        chatId: params.cid as Id<"chats">,
      })
    );
  },
});

function RouteComponent() {
  const { cid } = Route.useParams();
  const { data: messages } = useSuspenseQuery(
    convexQuery(api.messages.list, {
      chatId: cid as Id<"chats">,
    })
  );
  return (
    <ChatContainerRoot className="mx-auto w-full">
      <ChatContainerContent className="gap-4 p-4 mx-auto max-w-2xl">
        {messages.map((message) => (
          <Fragment key={message._id}>
            <UserMessage message={message} />
            <ServerMessage message={message} />
          </Fragment>
        ))}
      </ChatContainerContent>
    </ChatContainerRoot>
  );
}
