import { parseDataStream } from "@/lib/utils";
import {
  type TextUIPart,
  type ReasoningUIPart,
  parsePartialJson,
} from "@ai-sdk/ui-utils";
import type { UIMessage, JSONValue, ToolInvocation } from "ai";
import { useMemo } from "react";
import { match } from "ts-pattern";

type PartialToolCall = {
  text: string;
  step: number;
  index: number;
  toolName: string;
};

function useParts(text: string): UIMessage["parts"] {
  return useMemo(() => {
    const parsed = parseDataStream(text);
    const parts: UIMessage["parts"] = [];

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
      const part = parts.find(
        (part) =>
          part.type === "tool-invocation" &&
          part.toolInvocation.toolCallId === toolCallId
      );

      if (part !== undefined && "toolInvocation" in part) {
        part.toolInvocation = invocation;
      } else {
        parts.push({ type: "tool-invocation", toolInvocation: invocation });
      }
    }

    parsed.forEach((raw) =>
      match(raw)
        .with({ type: "text" }, (raw) => {
          if (currentTextPart == null) {
            currentTextPart = {
              type: "text",
              text: raw.value,
            };
            parts.push(currentTextPart);
          } else {
            currentTextPart.text += raw.value;
          }
        })
        .with({ type: "reasoning" }, (raw) => {
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
            parts.push(currentReasoningPart);
          }
        })
        .with({ type: "reasoning_signature" }, (raw) => {
          if (currentReasoningTextDetail != null) {
            if (currentReasoningTextDetail.type === "text") {
              currentReasoningTextDetail.signature = raw.value.signature;
            }
          }
        })
        .with({ type: "redacted_reasoning" }, (raw) => {
          if (currentReasoningPart == null) {
            currentReasoningPart = {
              type: "reasoning",
              reasoning: "",
              details: [],
            };
            parts.push(currentReasoningPart);
          }

          currentReasoningPart.details.push({
            type: "redacted",
            data: raw.value.data,
          });

          currentReasoningTextDetail = undefined;
        })
        .with({ type: "source" }, (raw) => {
          parts.push({
            type: "source",
            source: raw.value,
          });
        })
        .with({ type: "tool_call_streaming_start" }, (raw) => {
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
          const toolCallInvocation = {
            state: "call",
            step,
            ...raw.value,
          } as const;

          if (partialToolCalls[raw.value.toolCallId] != null) {
            toolInvocations![partialToolCalls[raw.value.toolCallId].index] =
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
        .with({ type: "finish_message" }, (raw) => {
          // todo
        })
        .with({ type: "file" }, (raw) => {
          // todo
        })
        .with({ type: "error" }, (raw) => {
          // todo
        })
        .with({ type: "start_step" }, (raw) => {
          // todo
        })
        .exhaustive()
    );

    return parts;
  }, [text]);
}
