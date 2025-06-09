import type { DataModel } from "convex/_generated/dataModel";
import { Triggers } from "convex-helpers/server/triggers";
import {
  customCtx,
  customMutation,
} from "convex-helpers/server/customFunctions";
import {
  mutation as rawMutation,
  internalMutation as rawInternalMutation,
} from "convex/_generated/server";
import { match } from "ts-pattern";
const triggers = new Triggers<DataModel>();

triggers.register("messages", async (ctx, change) => {
  await match(change)
    .with({ operation: "insert" }, async (change) => {
      const chat = await ctx.db.get(change.newDoc.chatId);
      if (!chat) {
        throw new Error("Chat not found");
      }
      await ctx.db.patch(change.newDoc.chatId, {
        lastMessageTimestamp: change.newDoc._creationTime,
      });
    })
    .otherwise((event) => {
      // ignore other operations
    });
});

export const mutation = customMutation(rawMutation, customCtx(triggers.wrapDB));
export const internalMutation = customMutation(
  rawInternalMutation,
  customCtx(triggers.wrapDB)
);
