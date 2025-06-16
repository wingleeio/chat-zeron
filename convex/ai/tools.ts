import { generateText, tool, type DataStreamWriter } from "ai";
import type { Doc } from "convex/_generated/dataModel";
import { getModel } from "convex/ai/provider";
import type { GenericActionCtx } from "convex/server";
import { v, type Infer } from "convex/values";
import { z } from "zod";
import { getDeepResearchPrompt } from "./prompt";

export const vTool = v.union(v.literal("search"), v.literal("deepResearch"));
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
      description:
        "Search the web for information with one or more queries. Ask the user for more information if needed before using this tool.",
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

          const data = await search(query);

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
    deepResearch: tool({
      description:
        "Perform deep research on a topic. Clarify the topic as precisely as possible with the user before using this tool.",
      parameters: z.object({
        details: z
          .string()
          .describe(
            "The details to research. Be as descriptive as possible to ensure the research is thorough."
          ),
      }),
      execute: async ({ details }) => {
        const MAX_TIME = 60 * 5 * 1000; // 5 minutes
        const startTime = Date.now();
        let findings: { text: string; source: string }[] = [];
        let shouldContinue = true;
        let nextSearchTopic: string | undefined = details;
        let urlToSearch: string | undefined = undefined;

        function addUpdate(data: {
          type: "search" | "analyze";
          status: "pending" | "completed" | "error";
          message: string;
        }) {
          opts.writer.writeMessageAnnotation({
            type: "deep_research",
            data,
          });
        }

        async function fetchAndExtract(url: string): Promise<string> {
          try {
            const res = await fetch(url, {
              headers: { "User-Agent": "Mozilla/5.0" },
            });
            const html = await res.text();
            const text = html
              .replace(/<script[\s\S]*?<\/script>/gi, "")
              .replace(/<style[\s\S]*?<\/style>/gi, "")
              .replace(/<[^>]+>/g, " ")
              .replace(/\s+/g, " ")
              .trim();
            return text;
          } catch (e) {
            return "";
          }
        }

        async function summarizeWithGemini(
          text: string,
          url: string
        ): Promise<string> {
          const prompt = `Summarize the following webpage content for research purposes. Focus on the main points, facts, and any unique insights.\nURL: ${url}\nContent:\n${text}`;
          const result = await generateText({
            model: getModel("openrouter", "google/gemini-2.0-flash-001"),
            prompt,
          });
          return result.text;
        }

        async function continueResearch(
          findings: { text: string; source: string }[]
        ) {
          const timeElapsed = Date.now() - startTime;
          const timeRemaining = MAX_TIME - timeElapsed;
          const timeRemainingMinutes =
            Math.round((timeRemaining / 1000 / 60) * 10) / 10;
          const result = await generateText({
            model: getModel("azure", "o4-mini"),
            prompt: getDeepResearchPrompt({
              details,
              timeRemainingMinutes,
              findings,
            }),
          });
          return JSON.parse(result.text) as any;
        }

        while (shouldContinue && Date.now() - startTime < MAX_TIME) {
          if (urlToSearch) {
            addUpdate({
              type: "search",
              status: "pending",
              message: `Visiting ${urlToSearch}`,
            });
            const pageText = await fetchAndExtract(urlToSearch);
            if (pageText.length > 200) {
              addUpdate({
                type: "analyze",
                status: "pending",
                message: `Summarizing content from ${urlToSearch}`,
              });
              const summary = await summarizeWithGemini(pageText, urlToSearch);
              findings.push({ text: summary, source: urlToSearch });
              addUpdate({
                type: "analyze",
                status: "completed",
                message: `Summarized content from ${urlToSearch}`,
              });
            } else {
              addUpdate({
                type: "analyze",
                status: "error",
                message: `Failed to extract content from ${urlToSearch}`,
              });
            }
            urlToSearch = undefined;
          } else if (nextSearchTopic) {
            addUpdate({
              type: "search",
              status: "pending",
              message: `Searching for: ${nextSearchTopic}`,
            });
            const searchResults = await search(nextSearchTopic);
            const topResults = deduplicateByDomainAndUrl(
              searchResults.organic.map((result) => ({
                url: result.link,
                title: result.title,
                content: result.snippet,
              }))
            ).slice(0, 2);
            for (const result of topResults) {
              urlToSearch = result.url;
              break;
            }
            if (!urlToSearch) {
              addUpdate({
                type: "search",
                status: "error",
                message: `No relevant URLs found for: ${nextSearchTopic}`,
              });
              break;
            }
            nextSearchTopic = undefined;
          } else {
            // Analyze findings and decide next steps
            addUpdate({
              type: "analyze",
              status: "pending",
              message: `Analyzing findings...`,
            });
            const analysis = await continueResearch(findings);
            shouldContinue = analysis.analysis.shouldContinue;
            nextSearchTopic = analysis.analysis.nextSearchTopic;
            urlToSearch = analysis.analysis.urlToSearch;
            addUpdate({
              type: "analyze",
              status: "completed",
              message: `Analysis complete.`,
            });
            if (!shouldContinue) break;
          }
        }
        // Final synthesis
        const finalAnalysis = await continueResearch(findings);

        return finalAnalysis;
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

async function search(query: string) {
  const parameters = {
    q: query,
    apiKey: process.env.SERPER_API_KEY!,
  };
  const queryString = new URLSearchParams(parameters).toString();
  const response = await fetch(
    "https://google.serper.dev/search?" + queryString
  );

  const data: SearchResult = await response.json();

  return data;
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
