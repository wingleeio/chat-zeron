import { workosWebhook, jwks } from "convex/auth";
import { streamChat } from "convex/chats";
import { httpRouter } from "convex/server";

const http = httpRouter();

http.route({
  path: "/workos-webhook",
  method: "POST",
  handler: workosWebhook,
});

http.route({
  path: "/jwks",
  method: "GET",
  handler: jwks,
});

http.route({
  path: "/stream",
  method: "POST",
  handler: streamChat,
});

export default http;
