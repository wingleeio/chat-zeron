import { ModelSelector } from "@/components/chat/model-selector";
import { Button } from "@/components/ui/button";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Authenticated } from "convex/react";
import { UserButton } from "@clerk/tanstack-react-start";
import { Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";

export function AppHeader() {
  const sidebar = useSidebar();
  return (
    <header className="p-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <Authenticated>
          <ModelSelector />
        </Authenticated>
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
      <UserButton />
    </header>
  );
}
