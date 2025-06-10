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
import type { StreamId } from "@convex-dev/persistent-text-streaming";
import type { Doc } from "convex/_generated/dataModel";
import { api } from "convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { CopyIcon, RefreshCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/chat/loaders";
import { useDrivenIds } from "@/stores/chat";

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
    "rounded-lg p-2 text-foreground bg-secondary prose break-words whitespace-normal",
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

function ServerMessage({ message }: { message: Doc<"messages"> }) {
  const drivenIds = useDrivenIds();
  const isDriven = drivenIds.includes(message.chatId);
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

  return (
    <Message className="flex-col">
      {status === "pending" && <Loader variant="typing" />}
      <MessageContent
        markdown
        className="bg-transparent py-0 prose dark:prose-invert"
      >
        {text}
      </MessageContent>
      {status === "done" && (
        <MessageActions>
          <MessageAction tooltip="Copy" side="bottom">
            <Button variant="ghost" size="icon">
              <CopyIcon className="size-3" />
            </Button>
          </MessageAction>
          <MessageAction tooltip="Regenerate" side="bottom">
            <Button variant="ghost" size="icon">
              <RefreshCcwIcon className="size-3" />
            </Button>
          </MessageAction>
        </MessageActions>
      )}
    </Message>
  );
}

function UserMessage({ message }: { message: Doc<"messages"> }) {
  return (
    <Message className="justify-end">
      <MessageContent markdown className="rounded-xl">
        {message.prompt}
      </MessageContent>
    </Message>
  );
}

export { ServerMessage, UserMessage };
