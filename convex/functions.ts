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
        status: "submitted",
      });
    })
    .with({ operation: "update" }, async (change) => {
      if (change.newDoc.content !== change.oldDoc.content) {
        const chat = await ctx.db.get(change.newDoc.chatId);
        if (!chat) {
          throw new Error("Chat not found");
        }
        await ctx.db.patch(change.newDoc._id, {
          searchContent: `${chat.title} ${change.newDoc.content}`,
        });
      }
    })
    .otherwise((_) => {
      // ignore other operations
    });
});

triggers.register("chats", async (ctx, change) => {
  await match(change)
    .with({ operation: "delete" }, async (change) => {
      for await (const message of ctx.db
        .query("messages")
        .withIndex("by_chat", (q) => q.eq("chatId", change.oldDoc._id))) {
        await ctx.db.delete(message._id);
      }
    })
    .with({ operation: "update" }, async (change) => {
      if (change.newDoc.title !== change.oldDoc.title) {
        for await (const message of ctx.db
          .query("messages")
          .withIndex("by_chat", (q) => q.eq("chatId", change.oldDoc._id))) {
          await ctx.db.patch(message._id, {
            searchContent: `${change.newDoc.title} ${message.content}`,
          });
        }
      }
    })
    .otherwise(() => {
      // ignore other operations
    });
});

export const mutation = customMutation(rawMutation, customCtx(triggers.wrapDB));
export const internalMutation = customMutation(
  rawInternalMutation,
  customCtx(triggers.wrapDB)
);
