import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { Link } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import { useMutation, usePaginatedQuery } from "convex/react";
import { EditIcon, Loader2Icon, PlusIcon, TrashIcon } from "lucide-react";
import { match } from "ts-pattern";
import type { Doc } from "convex/_generated/dataModel";
import { Fragment } from "react/jsx-runtime";
import { IconInnerShadowTop } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogContent,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import React from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Route } from "@/routes/__root";

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu className="flex-row">
          <SidebarMenuItem>
            <Button variant="ghost" size="icon" asChild>
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:!p-1.5 flex-shrink"
              >
                <Link to="/">
                  <IconInnerShadowTop className="!size-4" />
                  <span className="sr-only">Zeron</span>
                </Link>
              </SidebarMenuButton>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="overflow-x-hidden">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/">
                    <PlusIcon />
                    <span>New Chat</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarChats />
      </SidebarContent>
    </Sidebar>
  );
}

function SidebarChats() {
  const [editChat, setEditChat] = React.useState<Doc<"chats"> | null>(null);
  const [deleteChat, setDeleteChat] = React.useState<Doc<"chats"> | null>(null);
  const loadMoreRef = React.useRef<HTMLDivElement>(null);

  const chats = usePaginatedQuery(
    api.chats.getPaginated,
    {},
    { initialNumItems: 20 }
  );

  const data = Route.useLoaderData();

  const items = chats.results.length > 0 ? chats.results : data.chats.page;

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && chats.status === "CanLoadMore") {
          chats.loadMore(20);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [chats]);

  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

  const todayChats = items.filter(
    (chat) => chat.lastMessageTimestamp >= oneDayAgo
  );
  const lastWeekChats = items.filter(
    (chat) =>
      chat.lastMessageTimestamp >= oneWeekAgo &&
      chat.lastMessageTimestamp < oneDayAgo
  );
  const historyChats = items.filter(
    (chat) => chat.lastMessageTimestamp < oneWeekAgo
  );

  const renderChatGroup = (chatGroup: Doc<"chats">[], label: string) => {
    if (chatGroup.length === 0) return null;
    return (
      <SidebarGroup>
        <SidebarGroupLabel>{label}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {chatGroup.map((chat) => (
              <SidebarMenuItem
                key={chat._id}
                className="relative group/chat-item"
              >
                <SidebarMenuButton className="w-full" asChild>
                  <Link
                    to="/c/$cid"
                    params={{ cid: chat._id }}
                    className="w-full flex"
                    activeProps={{
                      className: "bg-muted",
                    }}
                  >
                    <span className="truncate flex-1">{chat.title}</span>
                    {match(chat.status)
                      .with("ready", () => null)
                      .otherwise(() => (
                        <Loader2Icon className="w-4 h-4 animate-spin text-muted-foreground" />
                      ))}
                  </Link>
                </SidebarMenuButton>
                <div className="absolute top-0 right-0 bottom-0 pointer-events-none flex justify-end gap-2 px-4 items-center group-hover/chat-item:opacity-100 opacity-0 transition-all duration-100 bg-gradient-to-l from-muted to-transparent w-full rounded-r-lg" />
                <div className="absolute top-0 right-0 bottom-0 translate-x-full group-hover/chat-item:translate-x-0 flex justify-end gap-2 px-2 items-center group-hover/chat-item:opacity-100 opacity-0 transition-all duration-100 rounded-r-lg">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        className="size-6 rounded-[10px]"
                        onClick={() => setEditChat(chat)}
                      >
                        <EditIcon className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Edit</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        className="size-6 rounded-[10px]"
                        onClick={() => setDeleteChat(chat)}
                      >
                        <TrashIcon className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delete</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  return (
    <Fragment>
      {renderChatGroup(todayChats, "Today")}
      {renderChatGroup(lastWeekChats, "Last Week")}
      {renderChatGroup(historyChats, "History")}
      {chats.status === "CanLoadMore" && (
        <div ref={loadMoreRef} className="h-4 w-full" />
      )}
      {chats.status === "LoadingMore" && (
        <div className="flex justify-center py-2">
          <Loader2Icon className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      )}
      <EditChatTitleDialog chat={editChat} setEditChat={setEditChat} />
      <DeleteChatDialog chat={deleteChat} setDeleteChat={setDeleteChat} />
    </Fragment>
  );
}

function EditChatTitleDialog({
  chat,
  setEditChat,
}: {
  chat: Doc<"chats"> | null;
  setEditChat: (chat: Doc<"chats"> | null) => void;
}) {
  const updateTitle = useMutation(api.chats.updateTitle);
  const form = useForm({
    defaultValues: {
      title: chat?.title ?? "",
    },
    validators: {
      onSubmit: z.object({
        title: z.string().min(1).max(100),
      }),
    },
    onSubmit: async ({ value }) => {
      if (!chat) return;
      await updateTitle({ chatId: chat._id, title: value.title });
      setEditChat(null);
    },
  });

  return (
    <Dialog open={!!chat} onOpenChange={() => setEditChat(null)}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Chat Title</DialogTitle>
        </DialogHeader>
        <DialogDescription>Edit the title of the chat.</DialogDescription>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <form.Field
                name="title"
                validators={{
                  onChange: ({ value }) => {
                    if (value.length === 0) return "Title is required";
                    if (value.length > 100)
                      return "Title must be less than 100 characters";
                  },
                }}
              >
                {(field) => (
                  <>
                    <input
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    {field.state.meta.errors ? (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors.join(", ")}
                      </p>
                    ) : null}
                  </>
                )}
              </form.Field>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditChat(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!form.state.canSubmit}
              onClick={() => form.handleSubmit()}
            >
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteChatDialog({
  chat,
  setDeleteChat,
}: {
  chat: Doc<"chats"> | null;
  setDeleteChat: (chat: Doc<"chats"> | null) => void;
}) {
  const params = useParams({ from: "/c/$cid", shouldThrow: false });
  const deleteChatMutation = useMutation(api.chats.deleteChat);
  const navigate = useNavigate();

  return (
    <Dialog open={!!chat} onOpenChange={() => setDeleteChat(null)}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Chat</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Are you sure you want to delete this chat? This action cannot be
          undone.
        </DialogDescription>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setDeleteChat(null)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={async () => {
              if (!chat) return;
              await deleteChatMutation({ chatId: chat._id });
              if (params?.cid === chat._id) {
                navigate({ to: "/" });
              }
              setDeleteChat(null);
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
