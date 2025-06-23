import {
  StreamIdValidator,
  type StreamBody,
  type StreamId,
} from "@convex-dev/persistent-text-streaming";
import { crud } from "convex-helpers/server/crud";
import { internal } from "convex/_generated/api";
import type { Doc } from "convex/_generated/dataModel";
import { internalQuery, query } from "convex/_generated/server";
import { internalMutation } from "convex/functions";
import { streamingComponent } from "convex/streaming";
import { v } from "convex/values";
import { match, P } from "ts-pattern";
import schema from "convex/schema";
import { r2 } from "convex/r2";
import type { UIMessage } from "ai";
import { convertToCoreMessages } from "ai";
import { vTool } from "convex/ai/schema";
import { checkUserCredits, type UserWithMetadata } from "convex/users";

export const { create, read, update } = crud(
  schema,
  "messages",
  internalQuery,
  internalMutation as any
);

export const prepare = internalMutation({
  args: {
    messageClientId: v.string(),
    chatClientId: v.string(),
    prompt: v.string(),
    tool: v.optional(vTool),
    files: v.optional(v.array(v.string())),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    user: UserWithMetadata;
    chat: Doc<"chats">;
    message: Doc<"messages">;
    messages: any[];
    model: Doc<"models">;
  }> => {
    const user = await ctx.runQuery(internal.auth.authenticate, {});

    if (!user) {
      throw new Error("Unauthorized");
    }

    if (!user.model) {
      throw new Error("Model not selected");
    }
    const model = await ctx.runQuery(internal.models.read, {
      id: user.model,
    });

    if (model?.isPremium && !user.isPremium) {
      throw new Error("Model is premium and user is not premium");
    }

    if (args.tool === "research" && !user.isPremium) {
      throw new Error("Research is only available to pro users");
    }

    if (model?.isDisabled) {
      throw new Error("Model is disabled");
    }

    if (!model) {
      throw new Error("Model not found");
    }

    const hasEnoughCredits = checkUserCredits(ctx, user, model.cost ?? 0);

    if (!hasEnoughCredits) {
      throw new Error("Not enough credits");
    }

    const maybeChat = await ctx.db
      .query("chats")
      .withIndex("by_client_id", (q) => q.eq("clientId", args.chatClientId))
      .first();

    const chat = await match(maybeChat)
      .with(P.nullish, async () => {
        const newChat = await ctx.runMutation(internal.chats.create, {
          userId: user._id,
          title: "",
          isPublic: false,
          status: "submitted",
          lastMessageTimestamp: Date.now(),
          clientId: args.chatClientId,
        });
        await ctx.scheduler.runAfter(0, internal.chats.generateTitle, {
          chatId: newChat._id,
          prompt: args.prompt,
        });
        return newChat;
      })
      .with(P.nonNullable, async (chat) => {
        await ctx.runMutation(internal.chats.update, {
          id: chat._id,
          patch: {
            status: "submitted",
          },
        });
        return chat;
      })
      .exhaustive();

    const streamId = await streamingComponent.createStream(ctx);

    const existingMessage = await ctx.db
      .query("messages")
      .withIndex("by_client_id", (q) => q.eq("clientId", args.messageClientId))
      .first();

    const message = await match(existingMessage)
      .with(P.nullish, async () => {
        return await ctx.runMutation(internal.messages.create, {
          prompt: args.prompt,
          userId: user._id,
          chatId: chat._id,
          responseStreamId: streamId,
          modelId: model._id,
          tool: args.tool,
          clientId: args.messageClientId,
        });
      })
      .with(P.nonNullable, async (message) => {
        await ctx.runMutation(internal.messages.update, {
          id: message._id,
          patch: {
            responseStreamId: streamId,
            prompt: args.prompt,
            tool: args.tool,
            modelId: model._id,
            uiMessages: "[]",
          },
        });
        return (await ctx.runQuery(internal.messages.read, {
          id: message._id,
        }))!;
      })
      .exhaustive();

    await ctx.runMutation(internal.messages.deleteMessagesAfterCreationTime, {
      chatId: chat._id,
      creationTime: message._creationTime,
    });

    const messages = await ctx.runQuery(internal.messages.history, {
      chatId: chat._id,
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

    return {
      user,
      chat,
      message,
      messages,
      model,
    };
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

export const search = query({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    const user = await ctx.runQuery(internal.auth.authenticate, {});

    if (!user) {
      throw new Error("Unauthorized");
    }

    return await ctx.db
      .query("messages")
      .withSearchIndex("searchableMessage", (q) =>
        q.search("searchContent", args.query).eq("userId", user._id)
      )
      .take(15)
      .then(
        async (messages) =>
          await Promise.all(
            messages.map(async (message) => {
              const chat = await ctx.db.get(message.chatId);
              if (!chat) {
                return null;
              }
              return {
                id: message._id,
                chatId: message.chatId,
                title: chat.title,
                prompt: message.prompt,
                content: message.content?.slice(chat.title.length + 1),
              };
            })
          )
      )
      .then((results) => results.filter((result) => result !== null));
  },
});

export const history = internalQuery({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
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
          .collect()
          .then((files) => files.filter((file) => file.role === "user"));

        const filePromises =
          files?.map(async (file) => {
            const url = await r2.getUrl(file.key, {
              expiresIn: 60,
            });

            return {
              type: "image",
              image: url,
            };
          }) ?? [];

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

export type MessageWithUIMessages = Omit<Doc<"messages">, "uiMessages"> & {
  uiMessages: UIMessage[];
  uploadedFiles: string[];
  responseStreamStatus: StreamBody["status"];
  responseStreamContent: string;
  model: Doc<"models">;
};

export const list = query({
  args: {
    clientId: v.string(),
  },
  handler: async (ctx, args): Promise<MessageWithUIMessages[] | null> => {
    const user = await ctx.runQuery(internal.auth.authenticate, {});

    const chat = await ctx.db
      .query("chats")
      .withIndex("by_client_id", (q) => q.eq("clientId", args.clientId))
      .first();

    if (!chat) {
      throw new Error("Chat not found");
    }

    if (chat.userId !== user?._id && !chat.isPublic) {
      return null;
    }

    return await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", chat._id))
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
              .collect()
              .then((files) => files.filter((file) => file.role === "user"));

            const uploadedFiles = await Promise.all(
              files.map(
                async (file) =>
                  await r2.getUrl(file.key, {
                    expiresIn: 60 * 60 * 3,
                  })
              ) ?? []
            );

            const content = stream.status === "done" ? stream.text : "";

            const uiMessages: UIMessage[] = await Promise.all(
              JSON.parse(message.uiMessages ?? "[]").map(
                async (uiMessage: UIMessage) => {
                  return {
                    ...uiMessage,
                    annotations: await Promise.all(
                      (uiMessage.annotations ?? []).map(
                        async (annotation: any) => {
                          if (
                            annotation.type === "image_generation_completion"
                          ) {
                            if (!annotation.data.key) {
                              return annotation;
                            }
                            if (
                              message._creationTime >
                              Date.now() - 2 * 60 * 60 * 1000
                            ) {
                              return annotation;
                            }
                            const imageUrl = await r2.getUrl(
                              annotation.data.key,
                              {
                                expiresIn: 60 * 60 * 3,
                              }
                            );
                            return {
                              ...annotation,
                              data: {
                                ...annotation.data,
                                imageUrl,
                              },
                            };
                          }
                          return annotation;
                        }
                      )
                    ),
                  };
                }
              )
            );

            return {
              ...message,
              uploadedFiles,
              responseStreamStatus: stream.status,
              responseStreamContent: content,
              model: model,
              uiMessages,
            };
          })
        );
      });
  },
});
