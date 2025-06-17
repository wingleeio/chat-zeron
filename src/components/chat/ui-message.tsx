import { MessageContent } from "@/components/chat/base-message";
import { ReasoningPart } from "@/components/chat/reasoning";
import { ChatSearchResults } from "@/components/chat/search-results";
import type { UIMessage } from "ai";
import { Fragment } from "react/jsx-runtime";
import { match } from "ts-pattern";
import { ChatImageResult } from "./chat-image-result";
import { getFromAnnotations } from "@/lib/utils";

function TextPart({ text }: { text: string }) {
  return (
    <MessageContent markdown className="bg-transparent py-0 w-full max-w-full!">
      {text}
    </MessageContent>
  );
}

export function UIMessage({ message }: { message: UIMessage }) {
  return (
    <Fragment>
      {message.parts.map((part, index) => (
        <Fragment key={index}>
          {match(part)
            .with({ type: "reasoning" }, (part) => (
              <ReasoningPart
                id={message.id + "-" + index}
                part={part}
                done={message.parts[index + 1] !== undefined}
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
                      "search_completion",
                      part.toolInvocation.toolCallId
                    )}
                    animate={message.parts[index + 1] === undefined}
                  />
                ))
                .with({ toolName: "image" }, (_toolInvocation) => (
                  <ChatImageResult
                    key={part.toolInvocation.toolCallId}
                    annotations={getFromAnnotations(
                      message,
                      "image_generation_completion",
                      part.toolInvocation.toolCallId
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
