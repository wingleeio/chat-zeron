"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { setDrivenIds } from "@/stores/chat";
import {
  convexQuery,
  useConvexAction,
  useConvexMutation,
} from "@convex-dev/react-query";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useParams, useNavigate } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import type { Doc, Id } from "convex/_generated/dataModel";
import {
  ArrowUp,
  GlobeIcon,
  Paperclip,
  Square,
  TelescopeIcon,
  X,
} from "lucide-react";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Tool } from "convex/ai/tools";
import { useModelSupports } from "@/hooks/use-model-supports";
import { useUploadFile } from "@convex-dev/r2/react";
import { useQuery } from "convex/react";
import { CircularLoader } from "@/components/chat/loaders";
import { toast } from "sonner";

type PromptInputContextType = {
  isLoading: boolean;
  value: string;
  setValue: (value: string) => void;
  maxHeight: number | string;
  onSubmit?: () => void;
  disabled?: boolean;
};

const PromptInputContext = createContext<PromptInputContextType>({
  isLoading: false,
  value: "",
  setValue: () => {},
  maxHeight: 240,
  onSubmit: undefined,
  disabled: false,
});

function usePromptInput() {
  const context = useContext(PromptInputContext);
  if (!context) {
    throw new Error("usePromptInput must be used within a PromptInput");
  }
  return context;
}

type PromptInputProps = {
  isLoading?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
  maxHeight?: number | string;
  onSubmit?: () => void;
  children: React.ReactNode;
  className?: string;
};

function PromptInput({
  className,
  isLoading = false,
  maxHeight = 240,
  value,
  onValueChange,
  onSubmit,
  children,
}: PromptInputProps) {
  const [internalValue, setInternalValue] = useState(value || "");

  const handleChange = (newValue: string) => {
    setInternalValue(newValue);
    onValueChange?.(newValue);
  };

  return (
    <TooltipProvider>
      <PromptInputContext.Provider
        value={{
          isLoading,
          value: value ?? internalValue,
          setValue: onValueChange ?? handleChange,
          maxHeight,
          onSubmit,
        }}
      >
        <div
          className={cn(
            "border-input bg-background rounded-3xl border p-2 shadow-xs",
            className
          )}
        >
          {children}
        </div>
      </PromptInputContext.Provider>
    </TooltipProvider>
  );
}

export type PromptInputTextareaProps = {
  disableAutosize?: boolean;
} & React.ComponentProps<typeof Textarea>;

function PromptInputTextarea({
  className,
  onKeyDown,
  disableAutosize = false,
  ...props
}: PromptInputTextareaProps) {
  const { value, setValue, maxHeight, onSubmit, disabled } = usePromptInput();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (disableAutosize) return;

    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height =
      typeof maxHeight === "number"
        ? `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px`
        : `min(${textareaRef.current.scrollHeight}px, ${maxHeight})`;
  }, [value, maxHeight, disableAutosize]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit?.();
    }
    onKeyDown?.(e);
  };

  return (
    <Textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      className={cn(
        "text-primary min-h-[44px] w-full resize-none border-none bg-transparent shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
        className
      )}
      rows={1}
      disabled={disabled}
      {...props}
    />
  );
}

type PromptInputActionsProps = React.HTMLAttributes<HTMLDivElement>;

function PromptInputActions({
  children,
  className,
  ...props
}: PromptInputActionsProps) {
  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      {children}
    </div>
  );
}

type PromptInputActionProps = {
  className?: string;
  tooltip: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
} & React.ComponentProps<typeof Tooltip>;

function PromptInputAction({
  tooltip,
  children,
  className,
  side = "top",
  ...props
}: PromptInputActionProps) {
  const { disabled } = usePromptInput();

  return (
    <Tooltip {...props}>
      <TooltipTrigger asChild disabled={disabled}>
        {children}
      </TooltipTrigger>
      <TooltipContent side={side} className={className}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

type R2File = {
  key: string;
  name: string;
};

type FilePreviewProps = {
  files: R2File[];
  fileUrls: (string | undefined)[] | undefined;
  onRemoveFile: (key: string) => void;
};

function FilePreview({ files, fileUrls, onRemoveFile }: FilePreviewProps) {
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});

  const handleImageLoad = (index: number) => {
    setLoadedImages((prev) => ({ ...prev, [index]: true }));
  };

  return (
    <div className="flex flex-wrap gap-2 pb-2">
      {files.map((file, index) => (
        <div key={index} className="flex items-center relative">
          <div className="relative size-16 rounded-sm overflow-hidden">
            {!loadedImages[index] && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <CircularLoader size="sm" />
              </div>
            )}
            <img
              src={fileUrls?.[index]}
              alt={file.name}
              className="size-16 rounded-sm object-cover"
              onLoad={() => handleImageLoad(index)}
            />
          </div>
          <Button
            onClick={() => onRemoveFile(file.key)}
            size="icon"
            className="rounded-full size-5 absolute -top-2 -right-2"
          >
            <X className="size-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}

function PromptInputWithActions() {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<R2File[]>([]);
  const [tool, setTool] = useState<Tool | undefined>(undefined);
  const supportsVision = useModelSupports("vision");
  const supportsTools = useModelSupports("tools");
  const navigate = useNavigate();
  const uploadFile = useUploadFile(api.files);
  const params = useParams({ from: "/c/$cid", shouldThrow: false });
  const queryClient = useQueryClient();
  const chatQuery = convexQuery(api.chats.getById, {
    id: params?.cid as Id<"chats">,
  });

  const fileUrls = useQuery(api.files.getFileUrls, {
    keys: files.map((file) => file.key),
  });

  const { data } = useSuspenseQuery(chatQuery);

  const chat = params?.cid ? data : null;

  const sendMessage = useMutation({
    mutationFn: useConvexAction(api.messages.send),
    onSuccess: async (message: Doc<"messages">) => {
      setDrivenIds((prev) => [...prev, message._id]);
      await navigate({
        to: "/c/$cid",
        params: { cid: message.chatId },
        replace: true,
      });
    },
  });

  const deleteFile = useMutation({
    mutationFn: useConvexMutation(api.files.deleteFile),
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const id = toast.loading("Uploading file...");
      const key = await uploadFile(file);
      setFiles((prev) => [...prev, { key, name: file.name }]);
      toast.success("File uploaded", {
        id,
      });
    },
  });

  const stop = useMutation({
    mutationFn: useConvexMutation(api.chats.stop),
    onSuccess: () => {
      queryClient.setQueryData(chatQuery.queryKey, (old: Doc<"chats">) => {
        return {
          ...old,
          status: "ready",
        };
      });
    },
  });

  const isLoading = useMemo(() => {
    return chat?.status === "streaming" || chat?.status === "submitted";
  }, [chat?.status]);

  const handleSubmit = () => {
    if (isLoading) return;
    if (input.trim() || files.length > 0) {
      if (chat?._id) {
        queryClient.setQueryData(
          convexQuery(api.messages.list, {
            chatId: chat?._id,
          }).queryKey,
          (old: Doc<"messages">[]) => {
            return [
              ...old,
              {
                id: "temp-message",
                prompt: input,
              },
            ];
          }
        );
      }
      sendMessage.mutate({
        chatId: chat?._id,
        prompt: input,
        tool,
        files: files.map((file) => file.key),
      });
      queryClient.setQueryData(chatQuery.queryKey, (old: Doc<"chats">) => {
        return {
          ...old,
          status: "submitted",
        };
      });
      setInput("");
      setFiles([]);
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files) {
      Array.from(event.target.files).forEach(async (file) => {
        upload.mutate(file);
      });
    }
  };

  const handleRemoveFile = async (key: string) => {
    await deleteFile.mutateAsync({
      key,
    });
    setFiles((prev) => prev.filter((file) => file.key !== key));
  };

  return (
    <PromptInput
      value={input}
      onValueChange={setInput}
      isLoading={isLoading}
      onSubmit={handleSubmit}
      className="w-full max-w-(--breakpoint-md) mx-auto p-3"
    >
      {files.length > 0 && (
        <FilePreview
          files={files}
          fileUrls={fileUrls}
          onRemoveFile={handleRemoveFile}
        />
      )}

      <PromptInputTextarea
        className="bg-transparent!"
        placeholder="Ask me anything..."
      />

      <PromptInputActions className="flex items-center justify-between gap-2 pt-2">
        {supportsVision && (
          <PromptInputAction tooltip="Attach files">
            <Button
              asChild
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
            >
              <label htmlFor="file-upload">
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                  id="file-upload"
                />
                <Paperclip className="size-4" />
              </label>
            </Button>
          </PromptInputAction>
        )}

        {supportsTools && (
          <PromptInputAction tooltip="Search">
            <Button
              variant="outline"
              className={cn(
                "h-8 rounded-full",
                tool === "search" &&
                  "text-primary hover:text-primary border-primary!"
              )}
              onClick={() => {
                if (tool === "search") {
                  setTool(undefined);
                } else {
                  setTool("search");
                }
              }}
            >
              <GlobeIcon className="size-4" />
              <span className="text-sm">Search</span>
            </Button>
          </PromptInputAction>
        )}

        {supportsTools && (
          <PromptInputAction tooltip="Deep Research">
            <Button
              variant="outline"
              className={cn(
                "h-8 rounded-full",
                tool === "deepResearch" &&
                  "text-primary hover:text-primary border-primary!"
              )}
              onClick={() => {
                if (tool === "deepResearch") {
                  setTool(undefined);
                } else {
                  setTool("deepResearch");
                }
              }}
            >
              <TelescopeIcon className="size-4" />
              <span className="text-sm">Deep Research</span>
            </Button>
          </PromptInputAction>
        )}

        <div className="flex-1" />

        <PromptInputAction
          tooltip={isLoading ? "Stop generation" : "Send message"}
        >
          <Button
            variant="default"
            size="icon"
            className="h-8 w-8 rounded-full"
            disabled={upload.isPending || (!supportsVision && files.length > 0)}
            onClick={() => {
              if (isLoading) {
                if (chat?._id) {
                  stop.mutate({
                    chatId: chat._id,
                  });
                }
              } else {
                handleSubmit();
              }
            }}
          >
            {isLoading ? (
              <Square className="size-4 fill-current" />
            ) : (
              <ArrowUp className="size-4" />
            )}
          </Button>
        </PromptInputAction>
      </PromptInputActions>
    </PromptInput>
  );
}

export {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
  PromptInputWithActions,
};
