import { clerkWebhook } from "convex/auth";
import { streamChat } from "convex/chats";
import { cors } from "convex/cors";
import { polar } from "convex/polar";
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

polar.registerRoutes(http as any);

export default http;
