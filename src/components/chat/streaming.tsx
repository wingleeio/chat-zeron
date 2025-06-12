import { Message, MessageActions } from "@/components/chat/base-message";
import { Loader } from "@/components/chat/loaders";
import { UIMessage } from "@/components/chat/ui-message";
import { Button } from "@/components/ui/button";
import { env } from "@/env.client";
import { useParseMessage } from "@/hooks/use-parse-message";
import { Route } from "@/routes/__root";
import { useDrivenIds } from "@/stores/chat";
import type {
  StreamBody,
  StreamId,
} from "@convex-dev/persistent-text-streaming";
import { useStream } from "@convex-dev/persistent-text-streaming/react";
import { api } from "convex/_generated/api";
import type { Doc } from "convex/_generated/dataModel";
import { CopyIcon } from "lucide-react";

type StreamingServerMessageProps = {
  message: Doc<"messages"> & {
    responseStreamStatus: StreamBody["status"];
  };
};

export function StreamingServerMessage({
  message,
}: StreamingServerMessageProps) {
  const drivenIds = useDrivenIds();
  const isDriven = drivenIds.includes(message._id);
  const context = Route.useRouteContext();
  const { text, status } = useStream(
    api.streaming.getStreamBody,
    new URL(`${env.VITE_CONVEX_SITE_URL}/stream`),
    message.responseStreamStatus === "pending" || isDriven,
    message.responseStreamId as StreamId,
    {
      authToken: context.token,
    }
  );

  const uiMessages = useParseMessage(text);

  return (
    <Message className="flex-col w-full">
      {status === "pending" && <Loader variant="typing" />}
      {uiMessages.map((message) => (
        <UIMessage key={message.id} message={message} />
      ))}
      <MessageActions className="opacity-0">
        <Button variant="ghost" size="icon">
          <CopyIcon className="size-3" />
        </Button>
      </MessageActions>
    </Message>
  );
}
