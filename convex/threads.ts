import { Agent, vStreamArgs } from "@convex-dev/agent";
import { generateText } from "ai";
import { components, internal } from "convex/_generated/api";
import { action, internalAction, query } from "convex/_generated/server";
import { provider } from "convex/ai/provider";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { match, P } from "ts-pattern";

export const agent = new Agent(components.agent, {
  name: "agent",
  chat: provider.languageModel("gpt-4o-mini"),
});

export const sendMessage = action({
  args: {
    prompt: v.string(),
    threadId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<string> => {
    const user = await ctx.runQuery(internal.auth.authenticate);

    if (!user) {
      throw new Error("Unauthorized");
    }

    const { threadId } = await match(args.threadId)
      .with(P.nullish, async () => {
        return await agent.createThread(ctx, { userId: user._id });
      })
      .with(P.nonNullable, async (threadId) => {
        const metadata = await agent.getThreadMetadata(ctx, { threadId });
        if (metadata.userId !== user._id) {
          throw new Error("User must be the owner of the thread");
        }
        return { threadId };
      })
      .exhaustive();

    const { messageId } = await agent.saveMessage(ctx, {
      prompt: args.prompt,
      threadId,
      skipEmbeddings: true,
      userId: user._id,
    });

    await ctx.scheduler.runAfter(0, internal.threads.generateTitle, {
      threadId,
      prompt: args.prompt,
    });

    await ctx.scheduler.runAfter(0, internal.threads.stream, {
      threadId,
      promptMessageId: messageId,
    });

    return threadId;
  },
});

export const stream = internalAction({
  args: {
    threadId: v.string(),
    promptMessageId: v.string(),
  },
  handler: async (ctx, args) => {
    const { thread } = await agent.continueThread(ctx, {
      threadId: args.threadId,
    });
    const result = await thread.streamText(
      { promptMessageId: args.promptMessageId },
      { saveStreamDeltas: true }
    );
    await result.consumeStream();
  },
});

export const listMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
    streamArgs: vStreamArgs,
  },
  handler: async (ctx, args) => {
    const { threadId, paginationOpts, streamArgs } = args;
    const user = await ctx.runQuery(internal.auth.authenticate);
    if (!user) {
      throw new Error("Unauthorized");
    }
    const metadata = await agent.getThreadMetadata(ctx, { threadId });

    if (metadata.userId !== user._id) {
      throw new Error("User must be the owner of the thread");
    }

    const streams = await agent.syncStreams(ctx, { threadId, streamArgs });

    const paginated = await agent.listMessages(ctx, {
      threadId,
      paginationOpts,
    });

    return {
      ...paginated,
      streams,
    };
  },
});

export const generateTitle = internalAction({
  args: {
    threadId: v.string(),
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

    await agent.updateThreadMetadata(ctx, {
      threadId: args.threadId,
      patch: {
        title: text,
      },
    });
  },
});
