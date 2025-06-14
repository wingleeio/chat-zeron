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
import { UserButton } from "@clerk/tanstack-start";
import { IconShare2 } from "@tabler/icons-react";
import { Link, useParams } from "@tanstack/react-router";
import type { Id } from "convex/_generated/dataModel";
import { PlusIcon } from "lucide-react";

export function AppHeader() {
  const sidebar = useSidebar();
  const params = useParams({ from: "/c/$cid", shouldThrow: false });
  return (
    <header className="p-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <ModelSelector />
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
      </div>
      <div className="flex items-center gap-2">
        {params?.cid && (
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
        )}
        <UserButton />
      </div>
    </header>
  );
}
