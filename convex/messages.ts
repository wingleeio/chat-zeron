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

        if (!existingChat) {
          throw new Error("Chat not found");
        }

        if (existingChat.status !== "ready") {
          throw new Error("Chat is not ready");
        }

        return existingChat;
      })
      .exhaustive();

    const streamId = await streamingComponent.createStream(ctx);

    const message = await ctx.runMutation(internal.messages.create, {
      prompt: args.prompt,
      userId: user._id,
      chatId: chat._id,
      responseStreamId: streamId,
    });

    return message;
  },
});

export const regenerate = action({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.auth.authenticate, {});

    if (!user) {
      throw new Error("Unauthorized");
    }

    const messageToRegenerate = await ctx.runQuery(internal.messages.read, {
      id: args.messageId,
    });

    if (!messageToRegenerate) {
      throw new Error("Message not found");
    }

    if (messageToRegenerate.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    const chat = await ctx.runQuery(internal.chats.read, {
      id: messageToRegenerate.chatId,
    });

    if (!chat) {
      throw new Error("Chat not found");
    }

    if (chat.status !== "ready") {
      throw new Error("Chat is not ready");
    }

    const streamId = await streamingComponent.createStream(ctx);

    await ctx.runMutation(internal.messages.update, {
      id: args.messageId,
      patch: {
        responseStreamId: streamId,
      },
    });
    await ctx.runMutation(internal.messages.deleteMessagesAfterCreationTime, {
      chatId: messageToRegenerate.chatId,
      creationTime: messageToRegenerate._creationTime,
    });
  },
});

export const deleteMessagesAfterCreationTime = internalMutation({
  args: {
    chatId: v.id("chats"),
    creationTime: v.number(),
  },
  handler: async (ctx, args) => {
    for await (const message of await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) =>
        q.eq("chatId", args.chatId).gt("_creationTime", args.creationTime)
      )
      .collect()) {
      await ctx.db.delete(message._id);
    }
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
        content: [
          {
            type: "text",
            text: message.agentMessage.text,
          },
        ],
      };

      if (agentMessage.content[0].text === "") return [userMessage];

      return [userMessage, agentMessage];
    });
  },
});

export const list = query({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.auth.authenticate, {});

    if (!user) {
      throw new Error("Unauthorized");
    }

    const chat = await ctx.runQuery(internal.chats.read, {
      id: args.chatId,
    });

    if (!chat) {
      throw new Error("Chat not found");
    }

    if (chat.userId !== user._id && !chat.isPublic) {
      throw new Error("Unauthorized");
    }

    return await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .collect()
      .then(async (messages) => {
        return await Promise.all(
          messages.map(async (message) => {
            const stream = await streamingComponent.getStreamBody(
              ctx,
              message.responseStreamId as StreamId
            );
            const content = stream.status === "done" ? stream.text : "";
            return {
              ...message,
              responseStreamStatus: stream.status,
              responseStreamContent: content,
            };
          })
        );
      });
  },
});
