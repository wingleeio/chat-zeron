import { internal } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { mutation } from "convex/functions";
import { streamingComponent } from "convex/streaming";
import { v } from "convex/values";
import { match, P } from "ts-pattern";

export const send = mutation({
  args: {
    prompt: v.string(),
    chatId: v.optional(v.id("chats")),
  },
  handler: async (ctx, args): Promise<Id<"messages">> => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.runQuery(internal.users.getByAuthId, {
      authId: identity.subject,
    });

    if (!user) {
      throw new Error("User not found");
    }

    const chat = await match(args.chatId)
      .with(P.nullish, () =>
        ctx.db.insert("chats", {
          userId: user._id,
          title: "New Chat",
          isPublic: true,
          status: "submitted",
          lastMessageTimestamp: Date.now(),
        })
      )
      .with(P.nonNullable, (chatId) => ctx.db.get(chatId))
      .exhaustive();

    return await ctx.db.insert("messages", {
      prompt: args.prompt,
      userId: user._id,
      chatId: match(chat)
        .with(P.nullish, () => {
          throw new Error("Chat not found");
        })
        .with(P.shape({ _id: P.string }), (chat) => chat._id)
        .with(P.nonNullable, (id) => id)
        .exhaustive(),
      responseStreamId: await streamingComponent.createStream(ctx),
    });
  },
});
