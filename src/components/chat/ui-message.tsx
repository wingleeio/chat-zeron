import { MessageContent } from "@/components/chat/base-message";
import { ReasoningPart } from "@/components/chat/reasoning";
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
            .with({ type: "text" }, (part) => <TextPart text={part.text} />)
            .otherwise(() => null)}
        </Fragment>
      ))}
    </Fragment>
  );
}
