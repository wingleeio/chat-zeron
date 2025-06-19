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
import {
  IconInnerShadowTop,
  IconSettings,
  IconShare2,
} from "@tabler/icons-react";
import { Link, useParams } from "@tanstack/react-router";
import type { Id } from "convex/_generated/dataModel";
import { PlusIcon } from "lucide-react";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { Fragment } from "react/jsx-runtime";
import { Badge } from "@/components/ui/badge";
import { CreditsBadge } from "@/components/app/credits-badge";
import { useChatByParamId } from "@/hooks/use-chat-by-param-id";

export function AppHeader() {
  const chat = useChatByParamId();

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
          <CreditsBadge />

          <ShareChatButton />

          <Tooltip>
            <TooltipTrigger>
              <Button variant="ghost" size="icon" asChild>
                <Link to="/settings">
                  <IconSettings className="!size-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>
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
        "opacity-0 transition-opacity",
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
  const chat = useChatByParamId();
  const me = useQuery(api.auth.current);

  return (
    params?.cid &&
    me?._id === chat?.userId && (
      <Fragment>
        {chat?.isPublic && (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="hidden md:block">
                Public
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              This chat is public. Anyone can view it.
            </TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger>
            <ShareModal id={params.cid as Id<"chats">}>
              <Button variant="ghost" size="icon">
                <IconShare2 className="size-4" />
              </Button>
            </ShareModal>
          </TooltipTrigger>
          <TooltipContent>Share chat</TooltipContent>
        </Tooltip>
      </Fragment>
    )
  );
}
