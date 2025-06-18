import { generateObject, generateText, tool } from "ai";
import { z } from "zod";
import { type GetToolsOpts } from "./tools";
import { getModel } from "convex/ai/provider";
import { getResearchPlanPrompt, getResearchPrompt } from "./prompt";
import Exa from "exa-js";

const exa = new Exa(process.env.EXA_API_KEY);

export type ResearchAnnotation =
  | {
      type: "status";
      message: string;
      toolCallId: string;
      innerToolCallId?: string;
    }
  | {
      type: "searching";
      query: string;
      toolCallId: string;
      innerToolCallId: string;
    }
  | {
      type: "searching_completed";
      query: string;
      title: string | null;
      url: string;
      toolCallId: string;
      innerToolCallId: string;
    }
  | {
      type: "reading_completed";
      query: string;
      title: string | null;
      url: string;
      content: string | null;
      toolCallId: string;
      innerToolCallId: string;
    };

const sendResearchAnnotation = (
  opts: GetToolsOpts,
  annotation: ResearchAnnotation
) => {
  opts.writer.writeMessageAnnotation({
    type: "research_completion",
    data: annotation,
  });
};

const planSchema = z.object({
  plan: z.array(
    z.object({
      title: z
        .string()
        .min(10)
        .max(70)
        .describe("A title for the research topic"),
      todos: z
        .array(z.string())
        .min(3)
        .max(5)
        .describe("A list of what to research for the given title"),
    })
  ),
});

type Plan = z.infer<typeof planSchema>["plan"];

async function createResearchPlan(prompt: string) {
  const { object } = await generateObject({
    model: getModel("azure", "gpt-4.1"),
    prompt: getResearchPlanPrompt(prompt),
    schema: planSchema,
  });

  return object.plan;
}

const performResearch = async (
  opts: GetToolsOpts,
  toolCallId: string,
  plan: Plan,
  prompt: string
) => {
  const maxSteps = plan.reduce((acc, curr) => acc + curr.todos.length, 0) + 2;

  const state = {
    sources: [] as {
      title: string | null | undefined;
      url: string;
      content: string | undefined;
      publishedDate: string | undefined;
      favicon: string | undefined;
    }[],
  };

  const { text } = await generateText({
    model: getModel("azure", "gpt-4.1"),
    system: getResearchPrompt(plan, maxSteps),
    prompt,
    maxSteps,
    temperature: 0,
    tools: {
      search: tool({
        description: "Search the web for information",
        parameters: z.object({
          query: z
            .string()
            .describe("The search query to achieve the todo")
            .max(100),
        }),
        execute: async ({ query }, { toolCallId: innerToolCallId }) => {
          sendResearchAnnotation(opts, {
            type: "status",
            message: "Searching the web for " + query,
            toolCallId,
            innerToolCallId,
          });

          sendResearchAnnotation(opts, {
            type: "searching",
            query,
            toolCallId,
            innerToolCallId,
          });

          const { results } = await exa
            .search(query, { numResults: 5 })
            .catch(() => ({ results: [] }));

          const formattedResults = results.map((result) => ({
            title: result.title,
            url: result.url,
            content: result.text,
            publishedDate: result.publishedDate,
            favicon: result.favicon,
          }));

          // Send each result individually
          for (const result of formattedResults) {
            sendResearchAnnotation(opts, {
              type: "searching_completed",
              query,
              title: result.title,
              url: result.url,
              toolCallId,
              innerToolCallId,
            });
          }

          if (results.length === 0) {
            return [];
          }
          sendResearchAnnotation(opts, {
            type: "status",
            message: "Reading content from the search results for " + query,
            toolCallId,
            innerToolCallId,
          });

          const { results: contentResults } = await exa
            .getContents(
              results.map((r) => r.url),
              {
                text: {
                  maxCharacters: 3000,
                  includeHtmlTags: false,
                },
                livecrawl: "preferred",
              }
            )
            .catch(() => ({ results: [] }));

          // Send each reading result individually
          for (const result of contentResults) {
            sendResearchAnnotation(opts, {
              type: "reading_completed",
              query,
              title: result.title,
              url: result.url,
              content: result.text.slice(0, 300) + "...",
              toolCallId,
              innerToolCallId,
            });
          }

          const finalResults = contentResults.map((result) => {
            const originalResult = formattedResults.find(
              (r) => r.url === result.url
            );
            return {
              title: result.title || originalResult?.title,
              url: result.url,
              content: result.text || originalResult?.content,
              publishedDate:
                result.publishedDate || originalResult?.publishedDate,
              favicon: result.favicon || originalResult?.favicon,
            };
          });

          state.sources.push(...finalResults);

          return finalResults.map((result) => ({
            title: result.title,
            url: result.url,
            content: result.content,
            publishedDate: result.publishedDate,
          }));
        },
      }),
    },
  });

  sendResearchAnnotation(opts, {
    type: "status",
    message: "Research completed",
    toolCallId,
  });

  return {
    ...state,
    text,
  };
};

export const researchTool = (opts: GetToolsOpts) => {
  return tool({
    description: "Perform deep research on a given topic.",
    parameters: z.object({
      prompt: z
        .string()
        .describe(
          "This should be the users exact prompt. Do not infer or change it in any way."
        ),
    }),
    execute: async ({ prompt }, { toolCallId }) => {
      sendResearchAnnotation(opts, {
        type: "status",
        message: "Creating a research plan",
        toolCallId,
      });

      const plan = await createResearchPlan(prompt);

      const research = await performResearch(opts, toolCallId, plan, prompt);

      return { research };
    },
  });
};
