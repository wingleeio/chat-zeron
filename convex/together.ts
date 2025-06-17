import { action } from "./_generated/server";
import { v } from "convex/values";
import Together from "together-ai";
import { r2 } from "./r2";
import { internal } from "./_generated/api";

const together = new Together({
  apiKey: process.env.TOGETHER_API_KEY,
});

export const generate = action({
  args: {
    prompt: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, { prompt, userId }) => {
    console.log("Starting image generation action...");
    try {
      const response = await together.images.create({
        model: "black-forest-labs/FLUX.1-schnell",
        prompt,
        steps: 4,
      });
      console.log("Received response from Together AI");

      const imageUrl = response.data[0]?.url;
      if (!imageUrl) {
        console.error("Image generation failed: No URL in response.");
        throw new Error("Image generation failed");
      }
      console.log(`Generated image URL: ${imageUrl}`);
      console.log("Fetching image from URL...");
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        console.error(`Failed to fetch image. Status: ${imageResponse.status}`);
        throw new Error(`Failed to fetch image from ${imageUrl}`);
      }
      console.log("Image fetched successfully.");

      const imageBlob = await imageResponse.blob();
      const imageArrayBuffer = await imageBlob.arrayBuffer();
      const imageUint8Array = new Uint8Array(imageArrayBuffer);
      console.log(
        `Image converted to Uint8Array. Size: ${imageUint8Array.length} bytes.`
      );
      console.log("Storing image in R2...");
      const key = await r2.store(ctx, imageUint8Array, {
        type: imageBlob.type,
      });
      console.log(`Image stored in R2 with key: ${key}`);
      console.log("Getting R2 URL...");
      const r2Url = await r2.getUrl(key);
      if (!r2Url) {
        console.error("Failed to get R2 URL for key:", key);
        throw new Error("Failed to get R2 URL");
      }
      console.log(`Got R2 URL: ${r2Url}`);
      console.log("Storing file metadata in database...");
      await ctx.runMutation(internal.files.create, {
        key,
        userId: userId,
      });
      console.log("File metadata stored successfully.");

      console.log("Returning R2 URL from action.");
      return r2Url;
    } catch (error) {
      console.error("Error in generate action:", error);
      throw error; // Re-throw the error to be caught by the caller
    }
  },
});
