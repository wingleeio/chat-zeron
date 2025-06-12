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
import { Authenticated, usePaginatedQuery } from "convex/react";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { match } from "ts-pattern";
import type { Doc } from "convex/_generated/dataModel";
import { Fragment } from "react/jsx-runtime";
import { IconInnerShadowTop } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

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
      <SidebarContent>
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
        <Authenticated>
          <SidebarChats />
        </Authenticated>
      </SidebarContent>
    </Sidebar>
  );
}

function SidebarChats() {
  const chats = usePaginatedQuery(
    api.chats.getPaginated,
    {},
    { initialNumItems: 20 }
  );

  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

  const todayChats = chats.results.filter(
    (chat) => chat.lastMessageTimestamp >= oneDayAgo
  );
  const lastWeekChats = chats.results.filter(
    (chat) =>
      chat.lastMessageTimestamp >= oneWeekAgo &&
      chat.lastMessageTimestamp < oneDayAgo
  );
  const historyChats = chats.results.filter(
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
              <SidebarMenuItem key={chat._id}>
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
    </Fragment>
  );
}
