import type { StreamBody } from "@convex-dev/persistent-text-streaming";
import type { Doc, Id } from "convex/_generated/dataModel";
import { api } from "convex/_generated/api";
import {
  CopyIcon,
  EditIcon,
  GitBranchIcon,
  Loader2Icon,
  RefreshCcwIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loader, CircularLoader } from "@/components/chat/loaders";
import { setDrivenIds } from "@/stores/chat";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  convexQuery,
  useConvexAction,
  useConvexMutation,
} from "@convex-dev/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { toast } from "sonner";
import type { UIMessage as UIMessageType } from "ai";

import React, { Fragment, useMemo, useState } from "react";
import {
  MessageAction,
  MessageActions,
  MessageContent,
} from "@/components/chat/base-message";
import { Message } from "@/components/chat/base-message";
import { UIMessage } from "@/components/chat/ui-message";
import type { ModelType } from "@/components/chat/model-icon";
import ModelIcon from "@/components/chat/model-icon";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Authenticated, useQuery } from "convex/react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";

type CompletedServerMessageProps = {
  message: Doc<"messages"> & {
    responseStreamStatus: StreamBody["status"];
    responseStreamContent: string;
    model: Doc<"models">;
  };
};

function CompletedServerMessage({ message }: CompletedServerMessageProps) {
  const params = useParams({ from: "/c/$cid" });
  const chatQuery = convexQuery(api.chats.getById, {
    id: params.cid as Id<"chats">,
  });
  const { data: chat } = useSuspenseQuery(chatQuery);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const me = useQuery(api.auth.current);

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

  const branch = useMutation({
    mutationFn: useConvexMutation(api.chats.branch),
    onSuccess: (id: Id<"chats">) => {
      navigate({
        to: "/c/$cid",
        params: {
          cid: id,
        },
      });
      toast.success("Created branch");
    },
  });

  const uiMessages: UIMessageType[] = JSON.parse(message.uiMessages ?? "[]");

  return (
    <Message id={`m-${message._id}`} className="flex-col w-full">
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
        {me?._id === chat?.userId && (
          <MessageAction
            tooltip="Regenerate"
            side="bottom"
            className={cn("hidden", me?._id === chat?.userId && "block")}
          >
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
        )}
        <Authenticated>
          <MessageAction tooltip="Branch" side="bottom">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                branch.mutate({
                  chatId: params.cid as Id<"chats">,
                  messageId: message._id,
                })
              }
            >
              <GitBranchIcon className="size-3" />
            </Button>
          </MessageAction>
        </Authenticated>
        <Button
          variant="ghost"
          className="hover:bg-transparent! cursor-default"
          asChild
        >
          <div>
            <ModelIcon model={message.model.icon as ModelType} />
            <span className="text-xs text-muted-foreground font-normal">
              {message.model.name}
            </span>
          </div>
        </Button>
      </MessageActions>
    </Message>
  );
}

function UserMessage({
  message,
}: {
  message: Doc<"messages"> & { uploadedFiles: string[] };
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [prompt, setPrompt] = useState(message.prompt);
  const params = useParams({ from: "/c/$cid" });
  const chatQuery = convexQuery(api.chats.getById, {
    id: params.cid as Id<"chats">,
  });
  const { data: chat } = useSuspenseQuery(chatQuery);
  const me = useQuery(api.auth.current);

  const isLoading = useMemo(() => {
    return chat?.status === "streaming" || chat?.status === "submitted";
  }, [chat?.status]);

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
    <Message className="flex-col items-end group/user-message">
      {message.uploadedFiles?.map((file, index) => (
        <UploadedFile
          key={index}
          src={file}
          alt={`Uploaded file ${index + 1}`}
        />
      ))}
      {isEditing ? (
        <Textarea
          className="rounded-xl px-4 bg-muted min-h-[60px] resize-none"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={6}
        />
      ) : (
        <MessageContent markdown className="rounded-xl px-4 bg-muted">
          {message.prompt}
        </MessageContent>
      )}
      <MessageActions
        className={cn(
          "group-hover/user-message:opacity-100 md:opacity-0 transition-opacity duration-200",
          isEditing && "opacity-100",
          me?._id === chat?.userId && "opacity-100",
          me?._id !== chat?.userId && "opacity-0 pointer-events-none"
        )}
      >
        {isEditing ? (
          <Fragment>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setPrompt(message.prompt);
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={isLoading}
              onClick={() => {
                setIsEditing(false);
                regenerate.mutate({ messageId: message._id, prompt });
                queryClient.setQueryData(
                  chatQuery.queryKey,
                  (old: Doc<"chats">) => {
                    return {
                      ...old,
                      status: "submitted",
                    };
                  }
                );
              }}
            >
              Save
            </Button>
          </Fragment>
        ) : (
          <Fragment>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                navigator.clipboard.writeText(message.prompt);
                toast.success("Copied to clipboard");
              }}
            >
              <CopyIcon className="size-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsEditing(true);
                setPrompt(message.prompt);
              }}
            >
              <EditIcon className="size-3" />
            </Button>
          </Fragment>
        )}
      </MessageActions>
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

type UploadedFileProps = {
  src: string;
  alt?: string;
  className?: string;
};

function UploadedFile({
  src,
  alt = "Uploaded file",
  className,
}: UploadedFileProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        className="relative size-18 rounded-md overflow-hidden cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <CircularLoader size="sm" />
          </div>
        )}
        <img
          src={src}
          alt={alt}
          className={cn("size-18 object-cover rounded-md", className)}
          onLoad={() => setIsLoading(false)}
        />
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="max-w-[95vw] max-h-[95vh] p-0 bg-transparent border-none"
          showCloseButton={false}
        >
          <div className="relative w-full h-full">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 bg-background/80 hover:bg-background"
              onClick={() => setIsOpen(false)}
            >
              <X className="size-4" />
            </Button>
            <img src={src} alt={alt} className="w-full h-full object-contain" />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export {
  PendingServerMessage,
  StreamingServerMessage,
  CompletedServerMessage,
  UserMessage,
};
