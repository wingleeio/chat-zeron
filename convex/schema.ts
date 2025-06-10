import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    authId: v.string(),
  }).index("by_auth_id", ["authId"]),
  chats: defineTable({
    title: v.string(),
    isPublic: v.boolean(),
    userId: v.id("users"),
    lastMessageTimestamp: v.number(),
  }).index("by_user", ["userId"]),
  messages: defineTable({
    role: v.string(),
    content: v.string(),
    userId: v.id("users"),
    chatId: v.id("chats"),
  }).index("by_chat", ["chatId"]),
});
