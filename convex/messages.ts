import {
  StreamIdValidator,
  type StreamId,
} from "@convex-dev/persistent-text-streaming";
import { crud } from "convex-helpers/server/crud";
import { internal } from "convex/_generated/api";
import type { Doc } from "convex/_generated/dataModel";
import { action, internalQuery, query } from "convex/_generated/server";
import { internalMutation } from "convex/functions";
import { streamingComponent } from "convex/streaming";
import { v } from "convex/values";
import { match, P } from "ts-pattern";
import schema from "convex/schema";
import { convertToCoreMessages } from "ai";
import { vTool } from "convex/ai/tools";
import { r2 } from "convex/r2";

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
    tool: v.optional(vTool),
    files: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args): Promise<Doc<"messages">> => {
    const user = await ctx.runQuery(internal.auth.authenticate, {});

    if (!user) {
      throw new Error("Unauthorized");
    }

    if (!user.model) {
      throw new Error("Model not selected");
    }

    const chat = await match(args.chatId)
      .with(P.nullish, async () => {
        const newChat = await ctx.runMutation(internal.chats.create, {
          userId: user._id,
          title: "",
          isPublic: false,
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
      modelId: user.model,
      tool: args.tool,
    });

    if (args.files) {
      for (const key of args.files) {
        const file = await ctx.runQuery(internal.files.getByKey, {
          key,
        });

        if (!file) {
          throw new Error("File not found");
        }

        await ctx.runMutation(internal.files.update, {
          id: file._id,
          patch: {
            messageId: message._id,
          },
        });
      }
    }

    return message;
  },
});

export const regenerate = action({
  args: {
    messageId: v.id("messages"),
    prompt: v.optional(v.string()),
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
        modelId: user.model,
        uiMessages: "[]",
        prompt: args.prompt || messageToRegenerate.prompt,
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
          agentMessages: userMessage.uiMessages
            ? JSON.parse(userMessage.uiMessages)
            : [],
        };
      })
    );

    const messages = await Promise.all(
      messagesWithStreamBody.map(async (message) => {
        const files = await ctx.db
          .query("files")
          .withIndex("by_message", (q) =>
            q.eq("messageId", message.userMessage._id)
          )
          .collect();

        const filePromises =
          files?.map(async (file) => ({
            type: "image",
            image: await r2.getUrl(file.key, {
              expiresIn: 60,
            }),
          })) ?? [];

        const fileContents = await Promise.all(filePromises);

        const userMessage = {
          role: "user",
          content: [
            {
              type: "text",
              text: message.userMessage.prompt,
            },
            ...fileContents,
          ],
        };

        const agentMessages = convertToCoreMessages(message.agentMessages);

        return [userMessage, ...agentMessages];
      })
    ).then((results) => results.flat());

    return messages;
  },
});

export const list = query({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.auth.authenticate, {});

    const chat = await ctx.runQuery(internal.chats.read, {
      id: args.chatId,
    });

    if (!chat) {
      return null;
    }

    if (chat.userId !== user?._id && !chat.isPublic) {
      return null;
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
            const model = await ctx.db.get(message.modelId);

            if (!model) {
              throw new Error("Model not found");
            }

            const files = await ctx.db
              .query("files")
              .withIndex("by_message", (q) => q.eq("messageId", message._id))
              .collect();

            const uploadedFiles = await Promise.all(
              files.map(
                async (file) =>
                  await r2.getUrl(file.key, {
                    expiresIn: 60 * 60 * 3,
                  })
              ) ?? []
            );

            const content = stream.status === "done" ? stream.text : "";
            return {
              ...message,
              uploadedFiles,
              responseStreamStatus: stream.status,
              responseStreamContent: content,
              model: model,
            };
          })
        );
      });
  },
});
