import { tool, type DataStreamWriter } from "ai";
import type { Doc } from "convex/_generated/dataModel";
import type { GenericActionCtx } from "convex/server";
import { v, type Infer } from "convex/values";
import { z } from "zod";

export const vTool = v.union(v.literal("search"));
export type Tool = Infer<typeof vTool>;

export function getTools(
  opts: {
    ctx: GenericActionCtx<any>;
    writer: DataStreamWriter;
    model: Doc<"models">;
  },
  activeTools: Tool[]
) {
  if (!opts.model.capabilities?.includes("tools")) {
    return {};
  }

  const tools: Record<Tool, any> = {
    search: tool({
      description: "Search the web for information with one or more queries",
      parameters: z.object({
        queries: z
          .array(z.string())
          .describe("Array of search queries to look up on the web"),
      }),
      execute: async ({ queries }) => {
        const promises = queries.map(async (query, index) => {
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (index + 1))
          );
          const parameters = {
            q: query,
            apiKey: process.env.SERPER_API_KEY!,
          };
          const queryString = new URLSearchParams(parameters).toString();
          const response = await fetch(
            "https://google.serper.dev/search?" + queryString
          );

          const data: SearchResult = await response.json();

          opts.writer.writeMessageAnnotation({
            type: "search_completion",
            data: {
              query,
              index,
              status: "completed",
              resultsCount: data.organic.length ?? 0,
            },
          });

          return {
            query: data.searchParameters.q,
            results: deduplicateByDomainAndUrl(
              data.organic.map((result) => ({
                url: result.link,
                title: result.title,
                content: result.snippet,
              }))
            ),
          };
        });

        const searches = await Promise.all(promises);

        return searches;
      },
    }),
  };

  return activeTools.reduce(
    (acc, tool) => {
      acc[tool] = tools[tool]!;
      return acc;
    },
    {} as Record<Tool, any>
  );
}

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

export type SearchResult = {
  searchParameters: SearchParameters;
  knowledgeGraph: KnowledgeGraph;
  organic: OrganicResult[];
  places: Place[];
  peopleAlsoAsk: PeopleAlsoAskItem[];
  relatedSearches: RelatedSearch[];
  credits: number;
};

// Search Parameters
export type SearchParameters = {
  q: string;
  type: string;
  engine: string;
};

// Knowledge Graph
export type KnowledgeGraph = {
  title: string;
  type: string;
  website: string;
  attributes: {
    [key: string]: string;
  };
};

// Organic Result
export type OrganicResult = {
  title: string;
  link: string;
  snippet: string;
  sitelinks?: Sitelink[];
  position: number;
};

// Sitelink
export type Sitelink = {
  title: string;
  link: string;
};

// Place
export type Place = {
  title: string;
  address: string;
  cid: string;
};

// People Also Ask Item
export type PeopleAlsoAskItem = {
  question: string;
  snippet: string;
  title: string;
  link: string;
};

// Related Search
export type RelatedSearch = {
  query: string;
};

const extractDomain = (url: string): string => {
  const urlPattern = /^https?:\/\/([^/?#]+)(?:[/?#]|$)/i;
  return url.match(urlPattern)?.[1] || url;
};

const deduplicateByDomainAndUrl = <T extends { url: string }>(
  items: T[]
): T[] => {
  const seenDomains = new Set<string>();
  const seenUrls = new Set<string>();

  return items.filter((item) => {
    const domain = extractDomain(item.url);
    const isNewUrl = !seenUrls.has(item.url);
    const isNewDomain = !seenDomains.has(domain);

    if (isNewUrl && isNewDomain) {
      seenUrls.add(item.url);
      seenDomains.add(domain);
      return true;
    }
    return false;
  });
};
