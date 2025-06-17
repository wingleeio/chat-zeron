import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useDebounce } from "@uidotdev/usehooks";
import { useOpenSearch } from "@/stores/chat";
import { setOpenSearch } from "@/stores/chat";

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

export function SearchCommand() {
  const open = useOpenSearch();
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
                  asChild
                  className="cursor-pointer flex-col items-start gap-1"
                >
                  <Link
                    to="/c/$cid"
                    params={{ cid: result.chatId }}
                    onClick={() => {
                      setOpenSearch(false);
                    }}
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
                          getSnippet(
                            result.content ?? "",
                            debouncedSearchQuery
                          ),
                          debouncedSearchQuery
                        ),
                      }}
                    />
                  </Link>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
      </CommandList>
    </CommandDialog>
  );
}
