import type { StreamId } from "@convex-dev/persistent-text-streaming";
import { generateText, smoothStream, streamText } from "ai";
import { crud } from "convex-helpers/server/crud";
import { api, internal } from "convex/_generated/api";
import type { Doc } from "convex/_generated/dataModel";
import {
  httpAction,
  internalAction,
  internalMutation,
  internalQuery,
  query,
} from "convex/_generated/server";
import { provider } from "convex/ai/provider";
import { mutation } from "convex/functions";
import schema from "convex/schema";
import { streamingComponent } from "convex/streaming";
import { v } from "convex/values";

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

      const messages: any = await ctx.runQuery(internal.messages.history, {
        chatId: message.chatId,
      });

      const abortController = new AbortController();

      const result = streamText({
        model: provider.languageModel("gpt-4o"),
        experimental_transform: smoothStream({
          chunking: "word",
        }),
        temperature: 0.8,
        messages,
        abortSignal: abortController.signal,
        onError: (error) => {
          console.error(error);
        },
      });

      await ctx.runMutation(internal.chats.update, {
        id: message.chatId,
        patch: {
          status: "streaming",
        },
      });

      let iterationCount = 0;

      for await (const chunk of result.textStream) {
        await append(chunk);

        iterationCount++;
        if (iterationCount % 15 === 0) {
          const chat = await ctx.runQuery(internal.chats.read, {
            id: message.chatId,
          });
          if (chat?.status === "ready") {
            abortController.abort();
            break;
          }
        }
      }

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
      model: provider.languageModel("gpt-4o-mini"),
      system: `\nc
      - you will generate a short title based on the first message a user begins a conversation with
      - ensure it is not more than 80 characters long
      - the title should be a summary of the user's message
      - do not use quotes or colons`,
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
    id: v.id("chats"),
  },
  handler: async (ctx, args): Promise<Doc<"chats">> => {
    const chat = await ctx.runQuery(internal.chats.read, {
      id: args.id,
    });

    if (!chat) {
      throw new Error("Chat not found");
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
