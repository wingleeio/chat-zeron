import { tool, type DataStreamWriter, type Tool as ToolType } from "ai";
import type { Doc } from "convex/_generated/dataModel";
import type { GenericActionCtx } from "convex/server";
import { z } from "zod";
import { internal } from "convex/_generated/api";
import { researchTool } from "convex/ai/research";
import type { Tool } from "convex/ai/schema";
import { IMAGE_GENERATION_COST, SEARCH_COST } from "@/lib/constants";
import { checkUserCredits, type UserWithMetadata } from "convex/users";
import type { ChatState } from "convex/chats";
import { env } from "@/env.server";

export type GetToolsOpts = {
  ctx: GenericActionCtx<any>;
  writer: DataStreamWriter;
  model: Doc<"models">;
  user: UserWithMetadata;
  message: Doc<"messages">;
  state: ChatState;
};

export function getTools(opts: GetToolsOpts, activeTools: Tool[]) {
  if (!opts.model.capabilities?.includes("tools")) {
    return {};
  }

  const tools: Record<Tool, ToolType> = {
    search: tool({
      description:
        "Search the web for information with one or more queries. Ask the user for more information if needed before using this tool.",
      parameters: z.object({
        queries: z
          .array(z.string())
          .describe("Array of search queries to look up on the web"),
      }),
      execute: async ({ queries }, { toolCallId }) => {
        const hasEnoughCredits = checkUserCredits(
          opts.ctx,
          opts.user,
          SEARCH_COST
        );

        if (!hasEnoughCredits) {
          return "User has reached their credit limit";
        }

        const promises = queries.map(async (query, index) => {
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (index + 1))
          );
          const parameters = {
            q: query,
            apiKey: env.SERPER_API_KEY!,
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
              toolCallId,
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

        opts.state.toolCost += SEARCH_COST;

        return searches;
      },
    }),
    image: tool({
      description: "Generate an image from a text prompt.",
      parameters: z.object({
        prompt: z.string().describe("The prompt to generate the image from."),
      }),
      execute: async ({ prompt }, { toolCallId }) => {
        const hasEnoughCredits = checkUserCredits(
          opts.ctx,
          opts.user,
          SEARCH_COST
        );

        if (!hasEnoughCredits) {
          return "User has reached their credit limit";
        }

        try {
          opts.writer.writeMessageAnnotation({
            type: "image_generation_completion",
            data: {
              prompt,
              status: "generating",
              toolCallId,
            },
          });
          const { imageUrl, key } = await opts.ctx.runAction(
            internal.together.generate,
            {
              prompt,
              userId: opts.user._id,
              messageId: opts.message._id,
            }
          );
          opts.writer.writeMessageAnnotation({
            type: "image_generation_completion",
            data: {
              prompt,
              status: "completed",
              imageUrl,
              key,
              toolCallId,
            },
          });
          opts.state.toolCost += IMAGE_GENERATION_COST;
          return "Image was successfully generated.";
        } catch (error) {
          opts.writer.writeMessageAnnotation({
            type: "image_generation_completion",
            data: {
              prompt,
              status: "failed",
            },
          });
          return "Image generation failed.";
        }
      },
    }),
    research: researchTool(opts),
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

export type ImageGenerationAnnotation = {
  type: "image_generation_completion";
  data:
    | {
        prompt: string;
        status: "completed";
        imageUrl: string;
        key: string;
      }
    | {
        prompt: string;
        status: "failed";
      }
    | {
        prompt: string;
        status: "generating";
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
