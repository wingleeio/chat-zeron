import { MessageContent } from "@/components/chat/base-message";
import { ReasoningPart } from "@/components/chat/reasoning";
import { ChatSearchResults } from "@/components/chat/search-results";
import type { UIMessage } from "ai";
import { Fragment } from "react/jsx-runtime";
import { match } from "ts-pattern";

function TextPart({ text }: { text: string }) {
  return (
    <MessageContent markdown className="bg-transparent py-0 w-full max-w-full!">
      {text}
    </MessageContent>
  );
}

function getFromAnnotations(message: UIMessage, type: string) {
  return (message.annotations?.filter(
    (annotation) => (annotation as any)?.type === type
  ) ?? []) as any;
}

export function UIMessage({ message }: { message: UIMessage }) {
  return (
    <Fragment>
      {message.parts.map((part, index) => (
        <Fragment key={index}>
          {match(part)
            .with({ type: "reasoning" }, (part) => (
              <ReasoningPart
                id={message.id}
                part={part}
                done={message.parts.length > 1}
              />
            ))
            .with({ type: "tool-invocation" }, (part) =>
              match(part.toolInvocation)
                .with({ toolName: "search" }, (toolInvocation) => (
                  <ChatSearchResults
                    key={part.toolInvocation.toolCallId}
                    result={
                      "result" in part.toolInvocation
                        ? part.toolInvocation.result
                        : undefined
                    }
                    queries={toolInvocation.args.queries}
                    annotations={getFromAnnotations(
                      message,
                      "search_completion"
                    )}
                  />
                ))
                .otherwise(() => null)
            )
            .with({ type: "text" }, (part) => <TextPart text={part.text} />)
            .otherwise(() => null)}
        </Fragment>
      ))}
    </Fragment>
  );
}
