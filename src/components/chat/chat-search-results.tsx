import { SearchIcon } from "lucide-react";
import { useMemo, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { match } from "ts-pattern";
import { PulseLoader } from "@/components/chat/loaders";
import { ChevronDown } from "lucide-react";
import { useReasoningDuration, setReasoningDuration } from "@/stores/chat";

type SearchResult = {
  title: string;
  url: string;
};

type Search = {
  query: string;
  results: SearchResult[];
  status: "searching" | "reading" | "completed";
};

export function ChatSearchResults({
  id,
  searches,
  status,
  done,
}: {
  id: string;
  searches: Search[];
  status: string;
  done: boolean;
}) {
  const [_isExpanded, setIsExpanded] = useState<boolean | undefined>(undefined);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const researchTime = useReasoningDuration(id);

  const toggleExpanded = () => {
    setIsExpanded((expanded) => !expanded);
  };

  const isExpanded = useMemo(() => {
    return _isExpanded === undefined ? !done : _isExpanded;
  }, [_isExpanded, done]);

  useEffect(() => {
    // Don't start timer if already done and we have a stored duration
    if (done && researchTime > 0) {
      return;
    }

    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }

    if (!done) {
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = (Date.now() - startTimeRef.current) / 1000;
          setReasoningDuration(id, elapsed);
        }
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (startTimeRef.current) {
        const finalTime = (Date.now() - startTimeRef.current) / 1000;
        setReasoningDuration(id, finalTime);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [done, id, researchTime]);

  return (
    <div className="flex flex-col gap-2 bg-muted/50 rounded-2xl border">
      <button
        onClick={toggleExpanded}
        className="text-sm text-primary flex items-center justify-between gap-2 px-4 pt-3 pb-1.5 text-left"
      >
        <div className="flex items-center gap-2 w-full">
          <span className="text-muted-foreground">{status}</span>
          {researchTime > 0.1 ? (
            <span className="text-muted-foreground">
              {` (${researchTime.toFixed(1)}s)`}
            </span>
          ) : null}
          <div className="flex-1" />
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200 text-muted-foreground",
              isExpanded ? "rotate-180" : ""
            )}
          />
        </div>
      </button>
      <div
        className={cn(
          "flex flex-col gap-2 transition-all duration-300 px-4 border-t",
          isExpanded
            ? "max-h-screen opacity-100 pt-4 pb-4"
            : "max-h-0 opacity-0 pointer-events-none"
        )}
      >
        {searches.length === 0 ? (
          <div className="flex gap-2">
            <div className="py-1">
              <div className="size-3 bg-muted-foreground/20 rounded-full animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="h-4 bg-muted-foreground/20 rounded mb-2 animate-pulse" />
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-6 bg-muted-foreground/20 rounded-full animate-pulse"
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          searches.map((search) => {
            return (
              <motion.div
                key={search.query.replace(" ", "-")}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex gap-2"
              >
                <div className="py-1 text-muted-foreground">
                  {match(search.status)
                    .with("searching", () => <PulseLoader className="size-3" />)
                    .with("reading", () => <PulseLoader className="size-3" />)
                    .with("completed", () => <SearchIcon className="size-3" />)
                    .exhaustive()}
                </div>
                <div className="flex-1">
                  <div className="text-sm mb-2">{search.query}</div>
                  <div className="grid grid-cols-3 gap-2">
                    {search.results.map((result) => {
                      const hostname = new URL(result.url).hostname;
                      return (
                        <div
                          key={result.url}
                          className="flex items-center gap-2 bg-muted/50 border border-border rounded-full px-3 py-1.5 hover:bg-muted/70 transition-colors"
                        >
                          <img
                            src={`https://www.google.com/s2/favicons?sz=128&domain=${hostname}`}
                            alt=""
                            className="h-3 w-3 object-contain"
                            onError={(e) => {
                              e.currentTarget.src =
                                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cline x1='12' y1='8' x2='12' y2='16'/%3E%3Cline x1='8' y1='12' x2='16' y2='12'%3E%3C/svg%3E";
                            }}
                          />
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors line-clamp-1 max-w-[200px]"
                          >
                            {result.title}
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
