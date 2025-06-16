import { internalMutation } from "convex/functions";
import { models } from "convex/ai/provider";
import type { UIMessage } from "ai";

export default internalMutation(async (ctx) => {
  for (const model of models) {
    const dbModel = await ctx.db
      .query("models")
      .withIndex("by_model", (q) => q.eq("model", model.model))
      .unique();
    if (!dbModel) {
      await ctx.db.insert("models", {
        name: model.name,
        model: model.model,
        provider: model.provider,
        searchField: `${model.name} ${model.provider}`,
        icon: model.icon,
        capabilities: model.capabilities,
        description: model.description,
        isPremium: model.isPremium,
        isDisabled: model.isDisabled,
      });
    } else {
      await ctx.db.patch(dbModel._id, {
        name: model.name,
        model: model.model,
        provider: model.provider,
        searchField: `${model.name} ${model.provider}`,
        icon: model.icon,
        capabilities: model.capabilities,
        description: model.description,
        isPremium: model.isPremium,
        isDisabled: model.isDisabled,
      });
    }
  }

  for (const message of await ctx.db
    .query("messages")
    .withIndex("by_search", (q) => q.eq("searchContent", undefined))
    .collect()) {
    const chat = await ctx.db.get(message.chatId);
    if (!chat) {
      continue;
    }
    const uiMessages: UIMessage[] = JSON.parse(message.uiMessages ?? "[]");

    const content = uiMessages
      .map((message) =>
        message.parts
          .filter((part) => part.type === "text")
          .map((part) => part.text)
          .join("")
      )
      .join("\n");

    await ctx.db.patch(message._id, {
      content: content,
      searchContent: `${chat.title} ${content}`,
    });
  }
});
