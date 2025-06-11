import {
  ChatContainerRoot,
  ChatContainerContent,
} from "@/components/chat/container";
import { AssistantMessage, UserMessage } from "@/components/chat/message";
import { Route } from "@/routes/t.$tid";
import { toUIMessages, useThreadMessages } from "@convex-dev/agent/react";
import { api } from "convex/_generated/api";
import { Fragment } from "react/jsx-runtime";
import { match } from "ts-pattern";

export function Thread() {
  const { tid } = Route.useParams();
  const { results } = useThreadMessages(
    api.threads.listMessages,
    { threadId: tid },
    { initialNumItems: 10, stream: true }
  );
  return (
    <Fragment>
      <ChatContainerRoot
        className="w-full flex-1"
        initial="instant"
        resize="smooth"
      >
        <ChatContainerContent className="gap-4 px-4 pt-32 pb-16 mx-auto max-w-3xl">
          {toUIMessages(results).map((message) => (
            <Fragment key={message.id}>
              {match(message)
                .with({ role: "user" }, () => <UserMessage message={message} />)
                .with({ role: "assistant" }, () => (
                  <AssistantMessage message={message} />
                ))
                .otherwise(() => null)}
            </Fragment>
          ))}
        </ChatContainerContent>
      </ChatContainerRoot>
    </Fragment>
  );
}
