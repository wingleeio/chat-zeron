import {
  ChevronDown,
  ExternalLink,
  Globe,
  Loader2,
  Search,
} from "lucide-react";
import { memo, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { ScrollableHorizontalFade } from "@/components/ui/scrollable-horizontal-fade";
import { cn } from "@/lib/utils";

export type ConciseSearchResult = {
  query: string;
  results: {
    url: string;
    title: string;
    content: string;
  }[];
};

export type SearchAnnotation = {
  type: "search_completion";
  data: {
    query: string;
    index: number;
    status: "completed";
    resultsCount: number;
  };
};

export type ChatSearchResultsProps = {
  result?: ConciseSearchResult[];
  queries: string[];
  annotations: SearchAnnotation[];
  animate?: boolean;
};

function NonMemoizedChatSearchResults(props: ChatSearchResultsProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const { result, queries, annotations, animate = true } = props;

  const toggleExpanded = () => {
    setIsExpanded((expanded) => !expanded);
  };

  const isLoading = useMemo(() => {
    return !result;
  }, [result]);

  const memoizedResult = useMemo(() => {
    return result ?? [];
  }, [result]);

  const resultCount = useMemo(() => {
    if (annotations.length > 0) {
      return annotations?.reduce((acc, a) => acc + a.data.resultsCount, 0);
    }

    if (result && result.length > 0) {
      return result.reduce((acc, r) => acc + r?.results?.length, 0);
    }

    return 0;
  }, [result, annotations]);

  return (
    <div className="py-2">
      <button
        onClick={toggleExpanded}
        className={cn(
          "group border-border text-muted-foreground flex items-center justify-between gap-2 rounded-full border px-4 py-2",
          "hover:bg-muted/20 transition-colors",
          isExpanded && "bg-muted/50"
        )}
      >
        <div className="rounded-lg">
          {isLoading ? (
            <Loader2 className="text-muted-foreground h-3 w-3 animate-spin" />
          ) : (
            <Globe className="text-muted-foreground h-3 w-3" />
          )}
        </div>
        <span className="pr-4 text-sm">Search Results</span>
        <Badge variant="outline" className="rounded-full px-2 py-0 text-xs">
          <Search className="mr-1.5 h-3 w-3" />
          {resultCount} Results
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
          {queries.map((query, i) => (
            <motion.div
              key={`${query}-${i}`}
              initial={animate ? { opacity: 0, x: 20 } : false}
              animate={animate ? { opacity: 1, x: 0 } : false}
              transition={{ duration: 0.3, delay: i * 0.1 }}
            >
              <Badge
                key={i}
                variant="outline"
                className="flex-shrink-0 rounded-full px-3 py-1.5"
              >
                <Search className="mr-1.5 h-3 w-3" />
                {query}
              </Badge>
            </motion.div>
          ))}
        </ScrollableHorizontalFade>

        {/* Horizontal scrolling results */}
        <ScrollableHorizontalFade className="pb-4">
          {memoizedResult &&
            memoizedResult.map?.((search) =>
              search?.results?.map((result, resultIndex) => (
                <motion.div
                  key={result.url}
                  initial={animate ? { opacity: 0, x: 20 } : false}
                  animate={animate ? { opacity: 1, x: 0 } : false}
                  transition={{ duration: 0.3, delay: resultIndex * 0.1 }}
                >
                  <SearchResultCard result={result} />
                </motion.div>
              ))
            )}
        </ScrollableHorizontalFade>
      </div>
    </div>
  );
}

export const ChatSearchResults = memo(NonMemoizedChatSearchResults);

function NonMemoizedSearchResultCard({
  result,
}: {
  result: ConciseSearchResult["results"][0];
}) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const onImageLoad = () => {
    setImageLoaded(true);
  };

  const onImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setImageLoaded(true);
    e.currentTarget.src =
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cline x1='12' y1='8' x2='12' y2='16'/%3E%3Cline x1='8' y1='12' x2='16' y2='12'/%3E%3C/svg%3E";
  };

  return (
    <div className="bg-background border-border w-[300px] flex-shrink-0 rounded-xl border transition-all h-full">
      <div className="p-4">
        <div className="mb-3 flex items-center gap-2.5">
          <div className="bg-muted relative flex min-h-10 min-w-10 items-center justify-center overflow-hidden rounded-lg">
            {!imageLoaded && (
              <div className="bg-muted-foreground/10 absolute inset-0 animate-pulse" />
            )}
            <img
              src={`https://www.google.com/s2/favicons?sz=128&domain=${new URL(result.url).hostname}`}
              alt=""
              className={cn(
                "h-6 w-6 object-contain",
                !imageLoaded && "opacity-0"
              )}
              onLoad={onImageLoad}
              onError={onImageError}
            />
          </div>
          <div>
            <h3 className="line-clamp-1 text-sm font-medium">{result.title}</h3>
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs hover:underline"
            >
              {new URL(result.url).hostname}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <p className="text-muted-foreground mb-3 line-clamp-3 text-sm">
          {result.content}
        </p>
      </div>
    </div>
  );
}

const SearchResultCard = memo(
  NonMemoizedSearchResultCard,
  (prevProps, nextProps) => {
    if (prevProps.result.url !== nextProps.result.url) return false;
    if (prevProps.result.title !== nextProps.result.title) return false;
    if (prevProps.result.content !== nextProps.result.content) return false;
    return true;
  }
);
