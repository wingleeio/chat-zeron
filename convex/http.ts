import { clerkWebhook } from "convex/auth";
import { streamChat } from "convex/chats";
import { cors } from "convex/cors";
import { httpRouter } from "convex/server";

const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: clerkWebhook,
});

http.route({
  path: "/stream",
  method: "POST",
  handler: streamChat,
});

http.route({
  path: "/stream",
  method: "OPTIONS",
  handler: cors,
});

export default http;
