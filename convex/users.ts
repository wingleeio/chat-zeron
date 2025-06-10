import { query, internalQuery } from "convex/_generated/server";
import { mutation } from "convex/functions";
import schema from "convex/schema";
import { v } from "convex/values";
import { crud } from "convex-helpers/server/crud";
import { internal } from "convex/_generated/api";
import type { Doc } from "convex/_generated/dataModel";

export const { create, destroy, update } = crud(
  schema,
  "users",
  query,
  mutation as any
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
