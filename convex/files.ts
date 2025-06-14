import { components, internal } from "convex/_generated/api";
import { R2 } from "@convex-dev/r2";
import { query } from "convex/_generated/server";
import { v } from "convex/values";
import { mutation } from "convex/functions";

export const r2 = new R2(components.r2);

export const { generateUploadUrl, syncMetadata } = r2.clientApi({
  checkUpload: async (ctx) => {
    const user = await ctx.runQuery(internal.auth.authenticate);

    if (!user) {
      throw new Error("User not authenticated");
    }
  },
  onUpload: async (ctx, _, key) => {
    const user = await ctx.runQuery(internal.auth.authenticate);
    if (!user) {
      throw new Error("User not authenticated");
    }

    await ctx.db.insert("files", {
      key,
      userId: user._id,
    });
  },
});

export const deleteFile = mutation({
  args: {
    key: v.string(),
  },
  handler: async (ctx, { key }) => {
    const user = await ctx.runQuery(internal.auth.authenticate);

    if (!user) {
      throw new Error("User not authenticated");
    }

    const file = await ctx.db
      .query("files")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    if (file?.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(file._id);
    await r2.deleteObject(ctx, key);
  },
});

export const getFileUrls = query({
  args: {
    keys: v.array(v.string()),
  },
  handler: async (_, { keys }): Promise<string[]> => {
    return await Promise.all(
      keys.map(async (id) => {
        return r2.getUrl(id, {
          expiresIn: 60 * 60 * 1, // 1 hour
        });
      })
    );
  },
});
