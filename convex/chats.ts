import { parseRawTextIntoUIMessages } from "@/lib/utils";
import type { StreamId } from "@convex-dev/persistent-text-streaming";
import { createDataStream, generateText, smoothStream, streamText } from "ai";
import { crud } from "convex-helpers/server/crud";
import { api, internal } from "convex/_generated/api";
import type { Doc, Id } from "convex/_generated/dataModel";
import {
  httpAction,
  internalAction,
  internalQuery,
  query,
} from "convex/_generated/server";
import { getPrompt } from "convex/ai/prompt";
import { getModel } from "convex/ai/provider";
import { getTools, type Tool } from "convex/ai/tools";
import { mutation, internalMutation } from "convex/functions";
import schema from "convex/schema";
import { paginationOptsValidator, type PaginationResult } from "convex/server";
import { streamingComponent } from "convex/streaming";
import { v } from "convex/values";
import type {
  CoreMessage,
  ToolCallPart,
  ToolResultPart,
  JSONValue,
  AssistantContent,
} from "ai";

export const streamChat = httpAction(async (ctx, request) => {
  const body: {
    streamId: StreamId;
  } = await request.json();

  const response = await streamingComponent.stream(
    ctx,
    request,
    body.streamId,
    async (...args) => {
      const ctx = args[0];
      const streamId = args[2];
      const append = args[3];

      const message = await ctx.runQuery(api.messages.getByStreamId, {
        streamId,
      });

      if (!message) {
        throw new Error("Message not found");
      }

      const user = await ctx.runQuery(internal.users.read, {
        id: message.userId,
      });

      if (!user) {
        throw new Error("User not found");
      }

      const messageHistory: any = await ctx.runQuery(
        internal.messages.history,
        {
          chatId: message.chatId,
        }
      );

      const messages: CoreMessage[] = messageHistory.flatMap(
        (m: Doc<"messages">) => {
          const turn: CoreMessage[] = [];

          // User message for this turn
          turn.push({ role: "user", content: m.prompt });

          // Assistant/tool messages for this turn
          if (m.uiMessages && m.uiMessages.trim() !== "") {
            try {
              const parsedUIMessages = parseRawTextIntoUIMessages(m.uiMessages);
              for (const uiMessage of parsedUIMessages) {
                if (uiMessage.role === "assistant") {
                  const toolCalls: ToolCallPart[] = [];
                  const textParts: string[] = [];
                  const toolResults: ToolResultPart[] = [];

                  for (const part of uiMessage.parts) {
                    if (part.type === "text") {
                      textParts.push(part.text);
                    } else if (part.type === "tool-invocation") {
                      if (part.toolInvocation.state === "call") {
                        toolCalls.push({
                          type: "tool-call",
                          toolCallId: part.toolInvocation.toolCallId,
                          toolName: part.toolInvocation.toolName,
                          args: part.toolInvocation.args as any,
                        });
                      } else if (part.toolInvocation.state === "result") {
                        toolResults.push({
                          type: "tool-result",
                          toolCallId: part.toolInvocation.toolCallId,
                          toolName: part.toolInvocation.toolName,
                          result: part.toolInvocation.result as JSONValue,
                        });
                      }
                    }
                  }

                  if (textParts.length > 0 || toolCalls.length > 0) {
                    const assistantContent: AssistantContent = [];
                    if (textParts.length > 0) {
                      assistantContent.push({
                        type: "text",
                        text: textParts.join(""),
                      });
                    }
                    assistantContent.push(...toolCalls);

                    turn.push({
                      role: "assistant",
                      content: assistantContent,
                    });
                  }

                  if (toolResults.length > 0) {
                    turn.push({
                      role: "tool",
                      content: toolResults,
                    });
                  }
                }
              }
            } catch (error) {
              console.error(
                `Failed to parse uiMessages for message ${m._id}:`,
                error
              );
              // Fallback for simple text responses if parsing fails
              if (m.content) {
                turn.push({ role: "assistant", content: m.content });
              }
            }
          } else if (m.content) {
            // Fallback for simple text responses
            turn.push({ role: "assistant", content: m.content });
          }

          return turn;
        }
      );

      console.log(
        "Constructed message history:",
        JSON.stringify(messages, null, 2)
      );

      const model = await ctx.runQuery(internal.models.read, {
        id: message.modelId,
      });

      if (!model) {
        throw new Error("Model not found");
      }

      const abortController = new AbortController();
      const activeTools: Tool[] = [];
      if (message.tool) {
        activeTools.push(message.tool);
      } else {
        // If no tool is manually selected, make the image tool available.
        activeTools.push("image");
      }

      const stream = createDataStream({
        execute: async (writer) => {
          const tools = getTools({ ctx, writer, model, user }, activeTools);
          console.log(
            "Constructed message history:",
            JSON.stringify(messages, null, 2)
          );
          console.log("Active tools:", Object.keys(tools));
          const result = streamText({
            model: getModel(model.provider, model.model),
            experimental_transform: smoothStream({
              chunking: "word",
            }),
            temperature: 0.8,
            messages,
            abortSignal: abortController.signal,
            tools,
            system: getPrompt({ ctx, user }),
            maxSteps: 3,
            onFinish: async ({ text }) => {
              await ctx.runMutation(internal.messages.update, {
                id: message._id,
                patch: {
                  content: text,
                },
              });
            },
          });

          result.consumeStream();
          result.mergeIntoDataStream(writer, {
            sendReasoning: true,
          });
        },
      });

      await ctx.runMutation(internal.chats.update, {
        id: message.chatId,
        patch: {
          status: "streaming",
        },
      });

      let iterationCount = 0;

      const reader = stream.getReader();

      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        if (value.startsWith("3:")) {
          break;
        }
        await append(value);
        text += value;
        iterationCount++;
        if (iterationCount % 50 === 0) {
          const chat = await ctx.runQuery(internal.chats.read, {
            id: message.chatId,
          });

          if (!chat) {
            abortController.abort();
            throw new Error("Chat not found");
          }

          if (chat?.status === "ready") {
            abortController.abort();
            break;
          }
        }
      }

      const uiMessages = parseRawTextIntoUIMessages(text);

      await ctx.runMutation(internal.messages.update, {
        id: message._id,
        patch: {
          uiMessages: JSON.stringify(uiMessages),
        },
      });

      await ctx.runMutation(internal.chats.update, {
        id: message.chatId,
        patch: {
          status: "ready",
        },
      });
    }
  );

  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Vary", "Origin");

  return response;
});

export const generateTitle = internalAction({
  args: {
    chatId: v.id("chats"),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    const { text } = await generateText({
      model: getModel("openrouter", "google/gemini-2.0-flash-001"),
      system: `\nc
      - you will generate a short title based on the first message a user begins a conversation with
      - ensure it is not more than 80 characters long
      - the title should be a summary of the user's message
      - do not use quotes or colons`,
      temperature: 0.8,
      prompt: args.prompt,
    });

    await ctx.runMutation(internal.chats.update, {
      id: args.chatId,
      patch: {
        title: text,
      },
    });
  },
});

export const { create, read, update } = crud(
  schema,
  "chats",
  internalQuery,
  internalMutation as any
);

export const getById = query({
  args: {
    id: v.optional(v.id("chats")),
  },
  handler: async (ctx, args): Promise<Doc<"chats"> | null> => {
    const user = await ctx.runQuery(internal.auth.authenticate, {});

    if (!args.id) {
      return null;
    }

    const chat = await ctx.runQuery(internal.chats.read, {
      id: args.id,
    });

    if (!chat) {
      return null;
    }

    if (!chat.isPublic && chat.userId !== user?._id) {
      return null;
    }

    return chat;
  },
});

export const stop = mutation({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.chats.update, {
      id: args.chatId,
      patch: {
        status: "ready",
      },
    });
  },
});

export const getPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (
    ctx,
    args
  ): Promise<
    PaginationResult<Doc<"chats"> & { branch: Doc<"chats"> | null }>
  > => {
    const user = await ctx.runQuery(internal.auth.authenticate, {});

    if (!user) {
      throw new Error("Unauthorized");
    }

    return await ctx.db
      .query("chats")
      .withIndex("by_user_lastMessageTimestamp", (q) =>
        q.eq("userId", user._id)
      )
      .order("desc")
      .paginate(args.paginationOpts)
      .then(async (result) => {
        const chats = await Promise.all(
          result.page.map(async (chat) => {
            if (chat.branchId) {
              const branch = await ctx.runQuery(internal.chats.read, {
                id: chat.branchId,
              });
              return {
                ...chat,
                branch: branch,
              };
            }
            return {
              ...chat,
              branch: null,
            };
          })
        );

        return {
          ...result,
          page: chats,
        };
      });
  },
});

export const updateTitle = mutation({
  args: {
    chatId: v.id("chats"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.auth.authenticate, {});

    if (args.title.length > 100) {
      throw new Error("Title must be less than 100 characters");
    }

    if (!user) {
      throw new Error("Unauthorized");
    }

    const chat = await ctx.runQuery(internal.chats.read, {
      id: args.chatId,
    });

    if (!chat) {
      throw new Error("Chat not found");
    }

    if (chat.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.runMutation(internal.chats.update, {
      id: args.chatId,
      patch: {
        title: args.title,
      },
    });
  },
});

export const deleteChat = mutation({
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

    if (chat.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.chatId);
  },
});

export const togglePublic = mutation({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args): Promise<Doc<"chats"> | null> => {
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

    if (chat.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    return await ctx.runMutation(internal.chats.update, {
      id: args.chatId,
      patch: {
        isPublic: !chat.isPublic,
      },
    });
  },
});

export const branch = mutation({
  args: {
    chatId: v.id("chats"),
    messageId: v.id("messages"),
  },
  handler: async (ctx, args): Promise<Id<"chats">> => {
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

    if (!chat.isPublic && chat.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    const message = await ctx.runQuery(internal.messages.read, {
      id: args.messageId,
    });

    if (!message || message.chatId !== args.chatId) {
      throw new Error("Message not found");
    }

    const branchedChat = await ctx.db.insert("chats", {
      title: chat.title,
      userId: user._id,
      isPublic: false,
      branchId: args.chatId,
      status: "ready",
      lastMessageTimestamp: Date.now(),
    });

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .collect();

    const messagesToInsert = messages.filter((messageToFilter) => {
      return messageToFilter._creationTime <= message._creationTime;
    });

    for (const message of messagesToInsert) {
      await ctx.db.insert("messages", {
        prompt: message.prompt,
        chatId: branchedChat,
        userId: user._id,
        modelId: message.modelId,
        responseStreamId: message.responseStreamId,
        uiMessages: message.uiMessages,
        tool: message.tool,
        error: message.error,
      });
    }

    return branchedChat;
  },
});
