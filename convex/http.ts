import { workosWebhook, jwks } from "convex/auth";
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

export default http;
