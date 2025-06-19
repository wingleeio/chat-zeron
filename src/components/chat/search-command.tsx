import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useDebounce } from "@uidotdev/usehooks";
import { useOpenSearch } from "@/stores/chat";
import { setOpenSearch } from "@/stores/chat";
import { usePaginatedChats } from "@/hooks/use-paginated-chats";
import { PlusIcon } from "lucide-react";

type SearchResult = {
  id: Id<"messages">;
  chatId: Id<"chats">;
  title: string;
  prompt: string;
  content: string | undefined;
};

function highlightMatch(text: string, query: string) {
  if (!query || !text) return text;
  const regex = new RegExp(`(${query})`, "gi");
  return text.replace(regex, "<strong>$1</strong>");
}

function getSnippet(
  text: string | undefined,
  query: string,
  contextLength: number = 50
): string {
  if (!text || !query) return text ?? "";
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return text;

  const start = Math.max(0, index - contextLength);
  const end = Math.min(text.length, index + query.length + contextLength);
  let snippet = text.slice(start, end);

  if (start > 0) snippet = "..." + snippet;
  if (end < text.length) snippet = snippet + "...";

  return snippet;
}

function SearchResultSkeleton() {
  return (
    <div className="flex flex-col gap-1 p-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
    </div>
  );
}

export function SearchCommand() {
  const chats = usePaginatedChats();
  const open = useOpenSearch();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const searchResults = useQuery(api.messages.search, {
    query: debouncedSearchQuery,
  });

  const isLoading = !!!searchResults;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpenSearch(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleNewChat = () => {
    setOpenSearch(false);
    navigate({ to: "/" });
  };

  const handleChatSelect = (chatId: Id<"chats">) => {
    setOpenSearch(false);
    navigate({ to: "/c/$cid", params: { cid: chatId } });
  };

  const handleSearchResultSelect = (chatId: Id<"chats">) => {
    setOpenSearch(false);
    navigate({ to: "/c/$cid", params: { cid: chatId } });
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpenSearch}
      showCloseButton={false}
      className="border py-1 bg-sidebar"
    >
      <CommandInput
        placeholder="Type your search query..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        {!debouncedSearchQuery && (
          <>
            <CommandGroup heading="Actions">
              <CommandItem onSelect={handleNewChat} className="cursor-pointer">
                <PlusIcon className="h-4 w-4 mr-2" />
                <span className="flex-1">New Chat</span>
                <span className="text-xs text-muted-foreground bg-muted/50 border border-border/70 px-2 py-0.5 rounded-sm">
                  ⇧⌘O
                </span>
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="Recent Chats">
              {chats.results.slice(0, 10).map((chat) => (
                <CommandItem
                  key={chat._id}
                  onSelect={() => handleChatSelect(chat._id)}
                  className="cursor-pointer"
                >
                  <div className="text-sm">{chat.title}</div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
        {debouncedSearchQuery && isLoading && (
          <CommandGroup heading="Search Results">
            {Array.from({ length: 5 }).map((_, index) => (
              <CommandItem key={index} className="cursor-default">
                <SearchResultSkeleton />
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {debouncedSearchQuery &&
          (searchResults?.length ?? 0) <= 0 &&
          !isLoading && <CommandEmpty>No results found.</CommandEmpty>}
        {debouncedSearchQuery &&
          (searchResults?.length ?? 0) > 0 &&
          searchResults && (
            <CommandGroup heading="Search Results">
              {searchResults?.map((result: SearchResult) => (
                <CommandItem
                  key={result.id}
                  onSelect={() => handleSearchResultSelect(result.chatId)}
                  className="cursor-pointer flex-col items-start gap-1"
                >
                  <div
                    className="text-sm"
                    dangerouslySetInnerHTML={{
                      __html: highlightMatch(
                        result.title,
                        debouncedSearchQuery
                      ),
                    }}
                  />
                  <div
                    className="text-xs text-muted-foreground"
                    dangerouslySetInnerHTML={{
                      __html: highlightMatch(
                        getSnippet(result.content ?? "", debouncedSearchQuery),
                        debouncedSearchQuery
                      ),
                    }}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          )}
      </CommandList>
    </CommandDialog>
  );
}
