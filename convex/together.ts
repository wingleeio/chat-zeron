import { action } from "./_generated/server";
import { v } from "convex/values";
import Together from "together-ai";

const together = new Together({
  apiKey: process.env.TOGETHER_API_KEY,
});

export const generate = action({
  args: {
    prompt: v.string(),
  },
  handler: async (ctx, { prompt }) => {
    const response = await together.images.create({
      model: "black-forest-labs/FLUX.1-schnell",
      prompt,
      steps: 4,
    });

    const url = response.data[0]?.url;
    if (!url) {
      throw new Error("Image generation failed");
    }
    return url;
  },
});
