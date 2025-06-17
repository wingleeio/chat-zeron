import {
  type TextUIPart,
  type ReasoningUIPart,
  parsePartialJson,
} from "@ai-sdk/ui-utils";
import {
  parseDataStreamPart,
  type JSONValue,
  type ToolInvocation,
  type UIMessage,
} from "ai";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { match } from "ts-pattern";
import { v4 } from "uuid";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function lazy<T>(fn: () => T): () => T {
  let called = false;
  let result: T;
  return () => {
    if (!called) {
      result = fn();
      called = true;
    }
    return result;
  };
}

export function parseDataStream(text: string) {
  const lines = text
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => {
      if (line.split(":")[1] !== "undefined") {
        return parseDataStreamPart(line);
      }
    })
    .filter((part) => part != null);

  return lines.filter((part, index) => {
    if (part?.type === "reasoning" && index > 0) {
      const prevPart = lines[index - 1];
      if (prevPart?.type === "reasoning" && prevPart.value === part.value) {
        return false;
      }
    }
    return true;
  });
}

type PartialToolCall = {
  text: string;
  step: number;
  index: number;
  toolName: string;
};

export function parseRawTextIntoUIMessages(text: string) {
  const parsed = parseDataStream(text);

  const messages: UIMessage[] = [];
  let currentMessage: UIMessage | undefined;

  const data: JSONValue[] = [];
  const messageAnnotations: JSONValue[] = [];
  const toolInvocations: ToolInvocation[] = [];
  const partialToolCalls: Record<string, PartialToolCall> = {};

  let step = 0;
  let currentTextPart: TextUIPart | undefined = undefined;
  let currentReasoningPart: ReasoningUIPart | undefined = undefined;
  let currentReasoningTextDetail:
    | ReasoningUIPart["details"][number]
    | undefined = undefined;

  function updateToolInvocationPart(
    toolCallId: string,
    invocation: ToolInvocation
  ) {
    if (!currentMessage) return;

    const part = currentMessage.parts.find(
      (part) =>
        part.type === "tool-invocation" &&
        part.toolInvocation.toolCallId === toolCallId
    );

    if (part !== undefined && "toolInvocation" in part) {
      part.toolInvocation = invocation;
    } else {
      currentMessage.parts.push({
        type: "tool-invocation",
        toolInvocation: invocation,
      });
    }
  }

  parsed.forEach((raw) =>
    match(raw)
      .with({ type: "text" }, (raw) => {
        if (!currentMessage) {
          currentMessage = {
            id: v4(),
            createdAt: new Date(),
            role: "assistant",
            content: "",
            parts: [],
            toolInvocations: [],
          };
          messages.push(currentMessage);
        }

        if (currentTextPart == null) {
          currentTextPart = {
            type: "text",
            text: raw.value,
          };
          currentMessage.parts.push(currentTextPart);
        } else {
          currentTextPart.text += raw.value;
        }
        currentMessage.content += raw.value;
      })
      .with({ type: "reasoning" }, (raw) => {
        if (!currentMessage) {
          currentMessage = {
            id: v4(),
            createdAt: new Date(),
            role: "assistant",
            content: "",
            parts: [],
            toolInvocations: [],
          };
          messages.push(currentMessage);
        }

        if (currentReasoningTextDetail == null) {
          currentReasoningTextDetail = {
            type: "text",
            text: raw.value,
          };
          if (currentReasoningPart != null) {
            currentReasoningPart.details.push(currentReasoningTextDetail);
          }
        } else {
          if (currentReasoningTextDetail.type === "text") {
            currentReasoningTextDetail.text += raw.value;
          }
        }

        if (currentReasoningPart == null) {
          currentReasoningPart = {
            type: "reasoning",
            reasoning: raw.value,
            details: [currentReasoningTextDetail],
          };
          currentMessage.parts.push(currentReasoningPart);
        } else {
          currentReasoningPart.reasoning += raw.value;
        }

        currentMessage.reasoning = (currentMessage.reasoning ?? "") + raw.value;
      })
      .with({ type: "reasoning_signature" }, (raw) => {
        if (currentReasoningTextDetail != null) {
          if (currentReasoningTextDetail.type === "text") {
            currentReasoningTextDetail.signature = raw.value.signature;
          }
        }
      })
      .with({ type: "redacted_reasoning" }, (raw) => {
        if (!currentMessage) {
          currentMessage = {
            id: v4(),
            createdAt: new Date(),
            role: "assistant",
            content: "",
            parts: [],
            toolInvocations: [],
          };
          messages.push(currentMessage);
        }

        if (currentReasoningPart == null) {
          currentReasoningPart = {
            type: "reasoning",
            reasoning: "",
            details: [],
          };
          currentMessage.parts.push(currentReasoningPart);
        }

        currentReasoningPart.details.push({
          type: "redacted",
          data: raw.value.data,
        });

        currentReasoningTextDetail = undefined;
      })
      .with({ type: "source" }, (raw) => {
        if (!currentMessage) {
          currentMessage = {
            id: v4(),
            createdAt: new Date(),
            role: "assistant",
            content: "",
            parts: [],
            toolInvocations: [],
          };
          messages.push(currentMessage);
        }
        currentMessage.parts.push({
          type: "source",
          source: raw.value,
        });
      })
      .with({ type: "tool_call_streaming_start" }, (raw) => {
        if (!currentMessage) {
          currentMessage = {
            id: v4(),
            createdAt: new Date(),
            role: "assistant",
            content: "",
            parts: [],
            toolInvocations: [],
          };
          messages.push(currentMessage);
        }

        partialToolCalls[raw.value.toolCallId] = {
          text: "",
          step,
          toolName: raw.value.toolName,
          index: toolInvocations.length,
        };

        const invocation = {
          state: "partial-call",
          step,
          toolCallId: raw.value.toolCallId,
          toolName: raw.value.toolName,
          args: undefined,
        } as const;

        toolInvocations.push(invocation);
        updateToolInvocationPart(raw.value.toolCallId, invocation);
      })
      .with({ type: "tool_call_delta" }, (raw) => {
        const partialToolCall = partialToolCalls[raw.value.toolCallId];
        if (partialToolCall == null) {
          return;
        }

        partialToolCall.text += raw.value.argsTextDelta;

        const { value: partialArgs } = parsePartialJson(partialToolCall.text);

        const deltaInvocation = {
          state: "partial-call",
          step: partialToolCall.step,
          toolCallId: raw.value.toolCallId,
          toolName: partialToolCall.toolName,
          args: partialArgs,
        } as const;

        toolInvocations[partialToolCall.index] = deltaInvocation;
        updateToolInvocationPart(raw.value.toolCallId, deltaInvocation);
      })
      .with({ type: "tool_call" }, (raw) => {
        if (!currentMessage) {
          currentMessage = {
            id: v4(),
            createdAt: new Date(),
            role: "assistant",
            content: "",
            parts: [],
            toolInvocations: [],
          };
          messages.push(currentMessage);
        }

        const toolCallInvocation = {
          state: "call",
          step,
          ...raw.value,
        } as const;

        if (partialToolCalls[raw.value.toolCallId] != null) {
          toolInvocations[partialToolCalls[raw.value.toolCallId].index] =
            toolCallInvocation;
        } else {
          toolInvocations.push(toolCallInvocation);
        }
        updateToolInvocationPart(raw.value.toolCallId, toolCallInvocation);
      })
      .with({ type: "tool_result" }, (raw) => {
        const toolInvocationIndex = toolInvocations.findIndex(
          (invocation) => invocation.toolCallId === raw.value.toolCallId
        );

        if (toolInvocationIndex === -1) {
          throw new Error(
            "tool_result must be preceded by a tool_call with the same toolCallId"
          );
        }

        const existingInvocation = toolInvocations[toolInvocationIndex];
        if (!existingInvocation) {
          throw new Error("Existing invocation not found");
        }

        const resultInvocation: ToolInvocation = {
          ...existingInvocation,
          state: "result",
          toolCallId: raw.value.toolCallId,
          toolName: existingInvocation.toolName,
          args: existingInvocation.args,
          result: raw.value.result,
        };

        toolInvocations[toolInvocationIndex] = resultInvocation;
        updateToolInvocationPart(raw.value.toolCallId, resultInvocation);
      })
      .with({ type: "data" }, (raw) => {
        data.push(...raw.value);
      })
      .with({ type: "message_annotations" }, (raw) => {
        messageAnnotations.push(...raw.value);
      })
      .with({ type: "finish_step" }, (raw) => {
        step += 1;
        currentTextPart = raw.value.isContinued ? currentTextPart : undefined;
        currentReasoningPart = undefined;
        currentReasoningTextDetail = undefined;
      })
      .with({ type: "start_step" }, (raw) => {
        if (!currentMessage) {
          currentMessage = {
            id: raw.value.messageId,
            createdAt: new Date(),
            role: "assistant",
            content: "",
            parts: [],
            toolInvocations: [],
          };
          messages.push(currentMessage);
        }
      })
      .with({ type: "finish_message" }, () => {
        if (currentMessage) {
          if (messageAnnotations.length > 0) {
            currentMessage.annotations = messageAnnotations;
          }
          currentMessage = undefined;
        }
      })
      .with({ type: "file" }, () => {
        // todo
      })
      .with({ type: "error" }, (raw) => {
        throw new Error(raw.value);
      })
      .exhaustive()
  );

  return messages;
}

export function getFromAnnotations(
  message: UIMessage,
  type: string,
  toolCallId?: string
) {
  return (message.annotations?.filter(
    (annotation) =>
      (annotation as any)?.type === type &&
      (toolCallId ? (annotation as any)?.data?.toolCallId === toolCallId : true)
  ) ?? []) as any;
}
