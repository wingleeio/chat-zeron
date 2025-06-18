import {
  query,
  internalQuery,
  type GenericCtx,
} from "convex/_generated/server";
import { internalMutation, mutation } from "convex/functions";
import schema from "convex/schema";
import { v } from "convex/values";
import { crud } from "convex-helpers/server/crud";
import { internal } from "convex/_generated/api";
import type { Doc } from "convex/_generated/dataModel";
import { polar } from "convex/polar";
import { FREE_CREDITS, PRO_CREDITS } from "@/lib/constants";

export const { create, destroy, update, read } = crud(
  schema,
  "users",
  internalQuery,
  internalMutation as any
);

export const readWithMetadata = internalQuery({
  args: {
    id: v.id("users"),
  },
  handler: async (ctx, args): Promise<UserWithMetadata | null> => {
    const user = await ctx.runQuery(internal.users.read, { id: args.id });

    if (!user) {
      return null;
    }

    const subscription = await polar.getCurrentSubscription(ctx, {
      userId: user._id,
    });

    return {
      ...user,
      isFree: !subscription,
      isPremium: !!subscription,
    };
  },
});

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

export type UserWithMetadata = Doc<"users"> & {
  isFree: boolean;
  isPremium: boolean;
};

export const getCurrent = query({
  args: {},
  handler: async (ctx): Promise<UserWithMetadata | null> => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return null;
    }

    const user = await ctx.runQuery(internal.users.getByAuthId, {
      authId: identity.subject,
    });

    if (!user) {
      return null;
    }

    const subscription = await polar.getCurrentSubscription(ctx, {
      userId: user._id,
    });

    return {
      ...user,
      isFree: !subscription,
      isPremium: !!subscription,
    };
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

export const resetCredits = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      await ctx.db.patch(user._id, {
        creditsUsed: 0,
      });
    }
  },
});

export const checkUserCredits = (
  _: GenericCtx,
  user: UserWithMetadata,
  cost: number
) => {
  const maxCredits = user.isPremium ? PRO_CREDITS : FREE_CREDITS;
  const creditsUsed = user.creditsUsed ?? 0;

  const availableCredits = maxCredits - creditsUsed;

  if (cost === 0) {
    return true;
  }

  if (availableCredits < cost) {
    return false;
  }

  return true;
};
