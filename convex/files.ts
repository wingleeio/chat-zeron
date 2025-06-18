import { internal } from "convex/_generated/api";
import { internalQuery, query } from "convex/_generated/server";
import { v } from "convex/values";
import { internalMutation, mutation } from "convex/functions";
import { r2 } from "convex/r2";
import { crud } from "convex-helpers/server/crud";
import schema from "convex/schema";
import { paginationOptsValidator, type PaginationResult } from "convex/server";
import type { Doc } from "convex/_generated/dataModel";

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
      role: "user",
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

export const { create, read, update } = crud(
  schema,
  "files",
  internalQuery,
  internalMutation as any
);

export const getByKey = internalQuery({
  args: {
    key: v.string(),
  },
  handler: async (ctx, { key }) => {
    return await ctx.db
      .query("files")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
  },
});

export const clearDangling = internalMutation({
  handler: async (ctx) => {
    const files = await ctx.db
      .query("files")
      .withIndex("by_message", (q) => q.eq("messageId", undefined))
      .collect();
    for (const file of files) {
      await ctx.db.delete(file._id);
      await r2.deleteObject(ctx, file.key);
    }
  },
});

export const getGeneratedByAgentImagesPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (
    ctx,
    { paginationOpts }
  ): Promise<
    PaginationResult<
      Doc<"files"> & {
        message?: Doc<"messages"> | null;
        url: string;
      }
    >
  > => {
    const user = await ctx.runQuery(internal.auth.authenticate);

    if (!user) {
      throw new Error("User not authenticated");
    }

    const files = await ctx.db
      .query("files")
      .withIndex("by_user_role", (q) =>
        q.eq("userId", user._id).eq("role", "agent")
      )
      .order("desc")
      .paginate(paginationOpts)
      .then(async (results) => ({
        ...results,
        page: await Promise.all(
          results.page.map(async (file) => ({
            ...file,
            message: file.messageId
              ? await ctx.db.get(file.messageId)
              : undefined,
            url: await r2.getUrl(file.key, {
              expiresIn: 60 * 60 * 1,
            }),
          }))
        ),
      }));

    return files;
  },
});
