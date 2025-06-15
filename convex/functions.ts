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
import { r2 } from "convex/r2";

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
    .with({ operation: "delete" }, async (change) => {
      await Promise.all(
        change.oldDoc?.files?.map(async (file) => {
          const fileDoc = await ctx.db
            .query("files")
            .withIndex("by_key", (q) => q.eq("key", file))
            .first();
          if (fileDoc) {
            await ctx.db.delete(fileDoc._id);
          }
          await r2.deleteObject(ctx, file);
        }) ?? []
      );
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
    .otherwise(() => {
      // ignore other operations
    });
});

export const mutation = customMutation(rawMutation, customCtx(triggers.wrapDB));
export const internalMutation = customMutation(
  rawInternalMutation,
  customCtx(triggers.wrapDB)
);
