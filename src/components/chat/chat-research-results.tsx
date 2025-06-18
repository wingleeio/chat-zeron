import type { ResearchAnnotation } from "convex/ai/research";
import { ChevronDown, ExternalLink, Globe, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { ScrollableHorizontalFade } from "@/components/ui/scrollable-horizontal-fade";
import { cn } from "@/lib/utils";

import { ChatSearchResults } from "@/components/chat/chat-search-results";

export function ChatResearchResults({
  annotations,
  done,
}: {
  annotations: { data: ResearchAnnotation }[];
  done: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const status = useMemo(() => {
    const statusAnnotations = annotations.filter(
      ({ data }) => data.type === "status"
    );

    const statusAnnotation = statusAnnotations[statusAnnotations.length - 1];

    if (statusAnnotation?.data.type === "status") {
      return statusAnnotation.data.message;
    }

    return "";
  }, [annotations]);

  const searches = useMemo(() => {
    const searchesAnnotations = annotations
      .filter(
        ({ data }) =>
          data.type === "searching_completed" ||
          data.type === "searching" ||
          data.type === "reading_completed"
      )
      .reduce(
        (acc, { data }) => {
          if (data.type === "searching_completed") {
            const existing = acc.find((a) => a.query === data.query);
            if (existing) {
              existing.results.push({
                title: data.title ?? "",
                url: data.url,
              });
              existing.status = "reading";
            }
          }

          if (data.type === "searching") {
            acc.push({
              query: data.query,
              results: [],
              status: "searching",
            });
          }

          if (data.type === "reading_completed") {
            const existing = acc.find((a) => a.query === data.query);
            if (existing) {
              existing.status = "completed";
            }
          }

          return acc;
        },
        [] as {
          query: string;
          results: { title: string; url: string }[];
          status: "searching" | "reading" | "completed";
        }[]
      );

    return searchesAnnotations;
  }, [annotations]);

  const sources = useMemo(() => {
    const sourcesAnnotations = annotations.filter(
      ({ data }) => data.type === "reading_completed"
    );

    return sourcesAnnotations;
  }, [annotations]);

  const toggleExpanded = () => {
    setIsExpanded((expanded) => !expanded);
  };

  return (
    <div className="py-2 px-2">
      <ChatSearchResults done={done} status={status} searches={searches} />
      <button
        onClick={toggleExpanded}
        className={cn(
          "group border-border text-muted-foreground flex items-center justify-between gap-2 rounded-full border px-4 py-2 mt-4",
          "hover:bg-muted/20 transition-colors",
          isExpanded && "bg-muted/50"
        )}
      >
        <div className="rounded-lg">
          {!done ? (
            <Loader2 className="text-muted-foreground h-3 w-3 animate-spin" />
          ) : (
            <Globe className="text-muted-foreground h-3 w-3" />
          )}
        </div>
        <span className="pr-4 text-sm">Sources Found</span>
        <Badge variant="outline" className="rounded-full px-2 py-0 text-xs">
          {sources.length} Sources
        </Badge>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isExpanded ? "rotate-180" : ""
          )}
        />
      </button>
      <div
        className={cn(
          "flex flex-col gap-2 transition-all duration-300",
          isExpanded ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <ScrollableHorizontalFade className="pt-4 pb-2">
          {sources.map((source, i) => {
            if (source.data.type !== "reading_completed") return null;
            return (
              <motion.div
                key={`${source.data.url}-${i}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
              >
                <div className="bg-muted/50  border-border w-[300px] flex-shrink-0 rounded-xl border transition-all h-full">
                  <div className="p-4">
                    <div className="mb-3 flex items-center gap-2.5">
                      <div className="bg-muted relative flex min-h-10 min-w-10 items-center justify-center overflow-hidden rounded-lg">
                        <img
                          src={`https://www.google.com/s2/favicons?sz=128&domain=${new URL(source.data.url).hostname}`}
                          alt=""
                          className="h-6 w-6 object-contain"
                          onError={(e) => {
                            e.currentTarget.src =
                              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cline x1='12' y1='8' x2='12' y2='16'/%3E%3Cline x1='8' y1='12' x2='16' y2='12'%3E%3C/svg%3E";
                          }}
                        />
                      </div>
                      <div>
                        <h3 className="line-clamp-1 text-sm font-medium">
                          {source.data.title}
                        </h3>
                        <a
                          href={source.data.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs hover:underline"
                        >
                          {new URL(source.data.url).hostname}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-3 line-clamp-3 text-sm">
                      {source.data.content}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </ScrollableHorizontalFade>
      </div>
    </div>
  );
}
