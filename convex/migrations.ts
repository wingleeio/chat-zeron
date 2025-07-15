import { Migrations } from "@convex-dev/migrations";
import { components, internal } from "convex/_generated/api";
import type { DataModel } from "convex/_generated/dataModel";

export const migrations = new Migrations<DataModel>(components.migrations);
export const run = migrations.runner();

export const convertToNewChat = migrations.define({
  table: "chats",
  migrateOne(ctx, doc) {
    ctx.db.patch(doc._id, {
      clientId: doc._id,
    });
  },
});

export const convertToNewMessage = migrations.define({
  table: "messages",
  migrateOne(ctx, doc) {
    ctx.db.patch(doc._id, {
      clientId: doc._id,
    });
  },
});

export const runAll = migrations.runner([
  internal.migrations.convertToNewChat,
  internal.migrations.convertToNewMessage,
]);
