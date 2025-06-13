import { crud } from "convex-helpers/server/crud";
import { internalQuery } from "convex/_generated/server";
import { internal } from "convex/_generated/api";
import { query } from "convex/_generated/server";
import { internalMutation, mutation } from "convex/functions";
import { v } from "convex/values";
import schema from "convex/schema";
import { vModel } from "convex/ai/provider";

export const list = query(async (ctx) => {
  return await ctx.db.query("models").withIndex("by_name").collect();
});

export const select = mutation({
  args: {
    modelId: v.id("models"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.auth.authenticate);

    if (!user) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(user._id, {
      model: args.modelId,
    });
  },
});

export const { read } = crud(
  schema,
  "models",
  internalQuery,
  internalMutation as any
);

export const getByModel = internalQuery({
  args: {
    model: vModel,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("models")
      .withIndex("by_model", (q) => q.eq("model", args.model))
      .first();
  },
});
