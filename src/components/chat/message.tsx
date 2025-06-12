import type { StreamBody } from "@convex-dev/persistent-text-streaming";
import type { Doc, Id } from "convex/_generated/dataModel";
import { api } from "convex/_generated/api";
import { CopyIcon, Loader2Icon, RefreshCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/chat/loaders";
import { setDrivenIds } from "@/stores/chat";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { convexQuery, useConvexAction } from "@convex-dev/react-query";
import { useParams } from "@tanstack/react-router";
import { toast } from "sonner";
import type { UIMessage as UIMessageType } from "ai";

import React from "react";
import {
  MessageAction,
  MessageActions,
  MessageContent,
} from "@/components/chat/base-message";
import { Message } from "@/components/chat/base-message";
import { UIMessage } from "@/components/chat/ui-message";

type CompletedServerMessageProps = {
  message: Doc<"messages"> & {
    responseStreamStatus: StreamBody["status"];
    responseStreamContent: string;
  };
};

function CompletedServerMessage({ message }: CompletedServerMessageProps) {
  const params = useParams({ from: "/c/$cid" });
  const chatQuery = convexQuery(api.chats.getById, {
    id: params.cid as Id<"chats">,
  });
  const queryClient = useQueryClient();

  const regenerate = useMutation({
    mutationFn: useConvexAction(api.messages.regenerate),
    onMutate: () => {
      setDrivenIds((prev) => [...prev, message._id]);
      queryClient.setQueryData(chatQuery.queryKey, (old: Doc<"chats">) => {
        return {
          ...old,
          status: "submitted",
        };
      });
    },
  });

  const uiMessages: UIMessageType[] = JSON.parse(message.uiMessages ?? "[]");

  return (
    <Message className="flex-col w-full">
      {uiMessages.map((message) => (
        <UIMessage key={message.id} message={message} />
      ))}
      <MessageActions>
        <MessageAction tooltip="Copy" side="bottom">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              navigator.clipboard.writeText(
                uiMessages
                  .map((m) =>
                    m.parts
                      .filter((p) => p.type === "text")
                      .map((p) => p.text)
                      .join("")
                  )
                  .join("\n")
              );
              toast.success("Copied to clipboard");
            }}
          >
            <CopyIcon className="size-3" />
          </Button>
        </MessageAction>
        <MessageAction tooltip="Regenerate" side="bottom">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => regenerate.mutate({ messageId: message._id })}
            disabled={regenerate.isPending}
          >
            {regenerate.isPending ? (
              <Loader2Icon className="size-3 animate-spin" />
            ) : (
              <RefreshCcwIcon className="size-3" />
            )}
          </Button>
        </MessageAction>
      </MessageActions>
    </Message>
  );
}

function UserMessage({ message }: { message: Doc<"messages"> }) {
  return (
    <Message className="justify-end">
      <MessageContent markdown className="rounded-xl px-4">
        {message.prompt}
      </MessageContent>
    </Message>
  );
}

const StreamingServerMessage = React.lazy(() =>
  import("@/components/chat/streaming").then((mod) => ({
    default: mod.StreamingServerMessage,
  }))
);

function PendingServerMessage() {
  return (
    <Message className="flex-col w-full">
      <Loader variant="typing" />
      <MessageContent
        markdown
        className="bg-transparent py-0 w-full max-w-full!"
      >
        {"   "}
      </MessageContent>
      <MessageActions className="opacity-0">
        <Button variant="ghost" size="icon">
          <CopyIcon className="size-3" />
        </Button>
      </MessageActions>
    </Message>
  );
}

export {
  PendingServerMessage,
  StreamingServerMessage,
  CompletedServerMessage,
  UserMessage,
};
