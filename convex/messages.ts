import {
  StreamIdValidator,
  type StreamId,
} from "@convex-dev/persistent-text-streaming";
import { crud } from "convex-helpers/server/crud";
import { internal } from "convex/_generated/api";
import type { Doc } from "convex/_generated/dataModel";
import {
  action,
  internalMutation,
  internalQuery,
  query,
} from "convex/_generated/server";
import { streamingComponent } from "convex/streaming";
import { v } from "convex/values";
import { match, P } from "ts-pattern";
import schema from "convex/schema";

export const { create, read, update } = crud(
  schema,
  "messages",
  internalQuery,
  internalMutation as any
);

export const send = action({
  args: {
    prompt: v.string(),
    chatId: v.optional(v.id("chats")),
  },
  handler: async (ctx, args): Promise<Doc<"messages">> => {
    const user = await ctx.runQuery(internal.auth.authenticate, {});

    if (!user) {
      throw new Error("Unauthorized");
    }

    const chat = await match(args.chatId)
      .with(P.nullish, async () => {
        const newChat = await ctx.runMutation(internal.chats.create, {
          userId: user._id,
          title: "",
          isPublic: true,
          status: "submitted",
          lastMessageTimestamp: Date.now(),
        });
        await ctx.scheduler.runAfter(0, internal.chats.generateTitle, {
          chatId: newChat._id,
          prompt: args.prompt,
        });
        return newChat;
      })
      .with(P.nonNullable, async (chatId) => {
        const existingChat = await ctx.runQuery(internal.chats.read, {
          id: chatId,
        });
        return existingChat;
      })
      .exhaustive();

    const streamId = await streamingComponent.createStream(ctx);

    const message = await ctx.runMutation(internal.messages.create, {
      prompt: args.prompt,
      userId: user._id,
      chatId: match(chat)
        .with(P.nullish, () => {
          throw new Error("Chat not found");
        })
        .with(P.shape({ _id: P.string }), (chat) => chat._id)
        .with(P.nonNullable, (id) => id)
        .exhaustive(),
      responseStreamId: streamId,
    });

    return message;
  },
});

export const getByStreamId = query({
  args: {
    streamId: StreamIdValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_stream", (q) => q.eq("responseStreamId", args.streamId))
      .first();
  },
});

export const history = internalQuery({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.auth.authenticate, {});

    if (!user) {
      throw new Error("Unauthorized");
    }

    const allMessages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .collect();

    const messagesWithStreamBody = await Promise.all(
      allMessages.map(async (userMessage) => {
        return {
          userMessage,
          agentMessage: await streamingComponent.getStreamBody(
            ctx,
            userMessage.responseStreamId as StreamId
          ),
        };
      })
    );

    return messagesWithStreamBody.flatMap((message) => {
      const userMessage = {
        role: "user",
        content: [
          {
            type: "text",
            text: message.userMessage.prompt,
          },
        ],
      };
      const agentMessage = {
        role: "assistant",
        content: JSON.parse(message.agentMessage.text || "[]"),
      };

      if (agentMessage.content.length === 0) return [userMessage];

      return [userMessage, agentMessage];
    });
  },
});

export const list = query({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .collect();
  },
});
