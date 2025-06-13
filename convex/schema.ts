import { defineSchema, defineTable } from "convex/server";
import { vStatus } from "convex/validators/chat";
import { v } from "convex/values";
import { StreamIdValidator } from "@convex-dev/persistent-text-streaming";
import { vCapabilities, vModel, vProvider } from "convex/ai/provider";

export default defineSchema({
  users: defineTable({
    authId: v.string(),
    model: v.optional(v.id("models")),
  }).index("by_auth_id", ["authId"]),
  chats: defineTable({
    title: v.string(),
    userId: v.id("users"),
    isPublic: v.boolean(),
    status: vStatus,
    lastMessageTimestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_lastMessageTimestamp", ["userId", "lastMessageTimestamp"]),
  messages: defineTable({
    prompt: v.string(),
    userId: v.id("users"),
    chatId: v.id("chats"),
    modelId: v.id("models"),
    uiMessages: v.optional(v.string()),
    responseStreamId: StreamIdValidator,
  })
    .index("by_chat", ["chatId"])
    .index("by_stream", ["responseStreamId"]),
  models: defineTable({
    name: v.string(),
    model: vModel,
    provider: vProvider,
    searchField: v.string(),
    icon: v.string(),
    capabilities: v.optional(v.array(vCapabilities)),
    description: v.optional(v.string()),
  })
    .index("by_name", ["name"])
    .index("by_model", ["model"]),
});
