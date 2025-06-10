import { defineSchema, defineTable } from "convex/server";
import { vStatus } from "convex/validators/chat";
import { v } from "convex/values";
import { StreamIdValidator } from "@convex-dev/persistent-text-streaming";

export default defineSchema({
  users: defineTable({
    authId: v.string(),
  }).index("by_auth_id", ["authId"]),
  chats: defineTable({
    title: v.string(),
    userId: v.id("users"),
    isPublic: v.boolean(),
    status: vStatus,
    lastMessageTimestamp: v.number(),
  }).index("by_user", ["userId"]),
  messages: defineTable({
    prompt: v.string(),
    userId: v.id("users"),
    chatId: v.id("chats"),
    responseStreamId: StreamIdValidator,
  }).index("by_chat", ["chatId"]),
});
