import { ModelSelector } from "@/components/chat/model-selector";
import { ShareModal } from "@/components/chat/share-modal";
import { Button } from "@/components/ui/button";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { SignInButton, UserButton } from "@clerk/tanstack-start";
import { IconInnerShadowTop, IconShare2 } from "@tabler/icons-react";
import { Link, useParams } from "@tanstack/react-router";
import type { Id } from "convex/_generated/dataModel";
import { PlusIcon } from "lucide-react";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "convex/_generated/api";

export function AppHeader() {
  const params = useParams({ from: "/c/$cid", shouldThrow: false });
  const chat = useQuery(
    api.chats.getById,
    params
      ? {
          id: params?.cid as Id<"chats">,
        }
      : "skip"
  );
  return (
    <header className="p-3 grid grid-cols-5">
      <div className="flex items-center gap-2 col-span-2">
        <Authenticated>
          <SidebarTrigger />
          <ModelSelector />
          <NewChatButton />
        </Authenticated>
        <Unauthenticated>
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <IconInnerShadowTop className="!size-4" />
              <span className="sr-only">Zeron</span>
            </Link>
          </Button>
        </Unauthenticated>
      </div>
      <div className="col-span-1 whitespace-nowrap overflow-hidden text-ellipsis">
        <Unauthenticated>{chat?.title}</Unauthenticated>
      </div>

      <div className="flex items-center gap-2 col-span-2 justify-end">
        <Authenticated>
          <ShareChatButton />
          <UserButton />
        </Authenticated>
        <Unauthenticated>
          <Button variant="outline" asChild>
            <SignInButton />
          </Button>
        </Unauthenticated>
      </div>
    </header>
  );
}

function NewChatButton() {
  const sidebar = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon"
      asChild
      className={cn(
        "opacity-0 transition-opacity size-7",
        !sidebar.open && "opacity-100",
        sidebar.open && "pointer-events-none"
      )}
    >
      <Link to="/">
        <PlusIcon className="size-4" />
      </Link>
    </Button>
  );
}

function ShareChatButton() {
  const params = useParams({ from: "/c/$cid", shouldThrow: false });
  const chat = useQuery(
    api.chats.getById,
    params
      ? {
          id: params?.cid as Id<"chats">,
        }
      : "skip"
  );
  const me = useQuery(api.auth.current);

  return (
    params?.cid &&
    me?._id === chat?.userId && (
      <Tooltip>
        <TooltipTrigger>
          <ShareModal id={params.cid as Id<"chats">}>
            <Button variant="ghost" size="icon" className="size-7">
              <IconShare2 className="size-4" />
            </Button>
          </ShareModal>
        </TooltipTrigger>
        <TooltipContent>Share chat</TooltipContent>
      </Tooltip>
    )
  );
}
