import { generateObject, generateText, tool } from "ai";
import { z } from "zod";
import { type GetToolsOpts } from "./tools";
import { getModel } from "convex/ai/provider";
import { getResearchPlanPrompt, getResearchPrompt } from "./prompt";
import Exa from "exa-js";

const exa = new Exa(process.env.EXA_API_KEY);

export type ResearchAnnotation = {};

const sendResearchAnnotation = (
  opts: GetToolsOpts,
  annotation: ResearchAnnotation
) => {
  opts.writer.writeMessageAnnotation({
    type: "research_completion",
    data: annotation,
  });
};

const planSchema = z.array(
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
);

type Plan = z.infer<typeof planSchema>;

async function createResearchPlan(
  opts: GetToolsOpts,
  toolCallId: string,
  prompt: string
) {
  sendResearchAnnotation(opts, {
    toolCallId,
  });
  const { object: plan } = await generateObject({
    model: getModel("azure", "gpt-4.1"),
    prompt: getResearchPlanPrompt(prompt),
    schema: planSchema,
  });

  return plan;
}

const performResearch = async (
  opts: GetToolsOpts,
  toolCallId: string,
  plan: Plan
) => {
  const maxSteps = plan.reduce((acc, curr) => acc + curr.todos.length, 0) + 2;
  const state = {};

  const { text } = await generateText({
    model: getModel("azure", "gpt-4.1"),
    system: getResearchPrompt(plan, maxSteps),
    maxSteps,
    tools: {},
  });

  return text;
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
      const plan = await createResearchPlan(opts, toolCallId, prompt);

      const research = await performResearch(opts, toolCallId, plan);

      return research;
    },
  });
};
