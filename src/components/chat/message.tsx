import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Markdown } from "./markdown";
import { useStream } from "@convex-dev/persistent-text-streaming/react";
import { env } from "@/env.client";
import type {
  StreamBody,
  StreamId,
} from "@convex-dev/persistent-text-streaming";
import type { Doc, Id } from "convex/_generated/dataModel";
import { api } from "convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { CopyIcon, Loader2Icon, RefreshCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/chat/loaders";
import { setDrivenIds, useDrivenIds } from "@/stores/chat";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { convexQuery, useConvexAction } from "@convex-dev/react-query";
import { useParams } from "@tanstack/react-router";
import { toast } from "sonner";

import { useParseMessage } from "@/hooks/use-parse-message";
export type MessageProps = {
  children: React.ReactNode;
  className?: string;
} & React.HTMLProps<HTMLDivElement>;

const Message = ({ children, className, ...props }: MessageProps) => (
  <div className={cn("flex gap-3", className)} {...props}>
    {children}
  </div>
);

export type MessageAvatarProps = {
  src: string;
  alt: string;
  fallback?: string;
  delayMs?: number;
  className?: string;
};

const MessageAvatar = ({
  src,
  alt,
  fallback,
  delayMs,
  className,
}: MessageAvatarProps) => {
  return (
    <Avatar className={cn("h-8 w-8 shrink-0", className)}>
      <AvatarImage src={src} alt={alt} />
      {fallback && (
        <AvatarFallback delayMs={delayMs}>{fallback}</AvatarFallback>
      )}
    </Avatar>
  );
};

export type MessageContentProps = {
  children: React.ReactNode;
  markdown?: boolean;
  className?: string;
} & React.ComponentProps<typeof Markdown> &
  React.HTMLProps<HTMLDivElement>;

const MessageContent = ({
  children,
  markdown = false,
  className,
  ...props
}: MessageContentProps) => {
  const classNames = cn(
    "rounded-lg p-2 text-foreground bg-secondary prose dark:prose-invert break-words whitespace-normal",
    className
  );

  return markdown ? (
    <Markdown className={classNames} {...props}>
      {children as string}
    </Markdown>
  ) : (
    <div className={classNames} {...props}>
      {children}
    </div>
  );
};

export type MessageActionsProps = {
  children: React.ReactNode;
  className?: string;
} & React.HTMLProps<HTMLDivElement>;

const MessageActions = ({
  children,
  className,
  ...props
}: MessageActionsProps) => (
  <div
    className={cn("text-muted-foreground flex items-center gap-2", className)}
    {...props}
  >
    {children}
  </div>
);

export type MessageActionProps = {
  className?: string;
  tooltip: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
} & React.ComponentProps<typeof Tooltip>;

const MessageAction = ({
  tooltip,
  children,
  className,
  side = "top",
  ...props
}: MessageActionProps) => {
  return (
    <TooltipProvider>
      <Tooltip {...props}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} className={className}>
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

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

type StreamingServerMessageProps = {
  message: Doc<"messages"> & {
    responseStreamStatus: StreamBody["status"];
  };
};

function StreamingServerMessage({ message }: StreamingServerMessageProps) {
  const drivenIds = useDrivenIds();
  const isDriven = drivenIds.includes(message._id);
  const { accessToken } = useAuth();
  const { text, status } = useStream(
    api.streaming.getStreamBody,
    new URL(`${env.VITE_CONVEX_SITE_URL}/stream`),
    isDriven,
    message.responseStreamId as StreamId,
    {
      authToken: accessToken,
    }
  );

  const parts = useParseMessage(text);

  console.log(parts);

  return (
    <Message className="flex-col w-full">
      {status === "pending" && <Loader variant="typing" />}
      <MessageContent
        markdown
        className="bg-transparent py-0 w-full max-w-full!"
      >
        {text}
      </MessageContent>
      <MessageActions className="opacity-0">
        <Button variant="ghost" size="icon">
          <CopyIcon className="size-3" />
        </Button>
      </MessageActions>
    </Message>
  );
}

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

  return (
    <Message className="flex-col w-full">
      <MessageContent
        markdown
        className="bg-transparent py-0 w-full max-w-full!"
      >
        {message.responseStreamContent}
      </MessageContent>
      <MessageActions>
        <MessageAction tooltip="Copy" side="bottom">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              navigator.clipboard.writeText(message.responseStreamContent);
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

export {
  PendingServerMessage,
  StreamingServerMessage,
  CompletedServerMessage,
  UserMessage,
  Message,
  MessageAvatar,
  MessageContent,
  MessageActions,
  MessageAction,
};
