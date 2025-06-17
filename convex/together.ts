import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import Together from "together-ai";
import { r2 } from "./r2";
import { internal } from "./_generated/api";

const together = new Together({
  apiKey: process.env.TOGETHER_API_KEY,
});

export const generate = internalAction({
  args: {
    prompt: v.string(),
    userId: v.id("users"),
    messageId: v.id("messages"),
  },
  handler: async (ctx, { prompt, userId, messageId }) => {
    const response = await together.images.create({
      model: "black-forest-labs/FLUX.1-schnell",
      prompt,
      steps: 4,
    });

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      throw new Error("Image generation failed");
    }
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image from ${imageUrl}`);
    }

    const imageBlob = await imageResponse.blob();
    const imageArrayBuffer = await imageBlob.arrayBuffer();
    const imageUint8Array = new Uint8Array(imageArrayBuffer);
    const key = await r2.store(ctx, imageUint8Array, {
      type: imageBlob.type,
    });

    const r2Url = await r2.getUrl(key, {
      expiresIn: 60 * 60 * 3,
    });
    if (!r2Url) {
      throw new Error("Failed to get R2 URL");
    }
    await ctx.runMutation(internal.files.create, {
      key,
      userId: userId,
      messageId,
      role: "agent",
    });
    return {
      imageUrl: r2Url,
      key,
    };
  },
});
