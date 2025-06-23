import { internalMutation } from "convex/functions";
import { models } from "convex/ai/provider";

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
        cost: model.cost,
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
        cost: model.cost,
      });
    }
  }

  for (const message of await ctx.db.query("messages").collect()) {
    await ctx.db.patch(message._id, {
      clientId: message._id,
    });
  }

  for (const chat of await ctx.db.query("chats").collect()) {
    await ctx.db.patch(chat._id, {
      clientId: chat._id,
    });
  }
});
