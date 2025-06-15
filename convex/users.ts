import { query, internalQuery } from "convex/_generated/server";
import { internalMutation, mutation } from "convex/functions";
import schema from "convex/schema";
import { v } from "convex/values";
import { crud } from "convex-helpers/server/crud";
import { internal } from "convex/_generated/api";
import type { Doc } from "convex/_generated/dataModel";

export const { create, destroy, update, read } = crud(
  schema,
  "users",
  internalQuery,
  internalMutation as any
);

export const getByAuthId = internalQuery({
  args: {
    authId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", args.authId))
      .first();
  },
});

export const getCurrent = query({
  args: {},
  handler: async (ctx): Promise<Doc<"users"> | null> => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return null;
    }

    return await ctx.runQuery(internal.users.getByAuthId, {
      authId: identity.subject,
    });
  },
});

export const updatePreferences = mutation({
  args: {
    preferences: v.object({
      nickname: v.optional(v.string()),
      biography: v.optional(v.string()),
      instructions: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.auth.authenticate);

    if (!user) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(user._id, {
      preferences: args.preferences,
    });
  },
});

export const updateAppearance = mutation({
  args: {
    appearance: v.object({
      mode: v.optional(v.union(v.literal("light"), v.literal("dark"))),
      theme: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.auth.authenticate);

    if (!user) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(user._id, {
      appearance: args.appearance,
    });
  },
});
