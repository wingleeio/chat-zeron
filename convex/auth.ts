import { internal } from "convex/_generated/api";
import type { Doc } from "convex/_generated/dataModel";
import { httpAction, internalQuery, query } from "convex/_generated/server";
import { match } from "ts-pattern";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/tanstack-react-start/server";

export const clerkWebhook = httpAction(async (ctx, request) => {
  const bodyText = await request.text();
  const svixId = String(request.headers.get("svix-id"));
  const svixTimestamp = String(request.headers.get("svix-timestamp"));
  const svixSignature = String(request.headers.get("svix-signature"));

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET_KEY!);
  const msg = wh.verify(bodyText, {
    "svix-id": svixId,
    "svix-timestamp": svixTimestamp,
    "svix-signature": svixSignature,
  }) as WebhookEvent;

  return await match(msg)
    .with({ type: "user.created" }, async ({ data }) => {
      const user = await ctx.runQuery(internal.users.getByAuthId, {
        authId: data.id,
      });

      if (user) {
        return Response.json({ status: "success" });
      }

      await ctx.runMutation(internal.users.create, {
        authId: data.id,
      });

      return Response.json({ status: "success" });
    })
    .with({ type: "user.deleted" }, async ({ data }) => {
      if (!data.id) {
        return Response.json({ status: "success" });
      }

      const user = await ctx.runQuery(internal.users.getByAuthId, {
        authId: data.id,
      });

      if (!user) {
        return Response.json({ status: "success" });
      }

      await ctx.runMutation(internal.users.destroy, {
        id: user._id,
      });

      return Response.json({ status: "success" });
    })
    .with({ type: "user.updated" }, async () => {
      return Response.json({ status: "success" });
    })
    .otherwise(() => Response.json({ status: "success" }));
});

export const authenticate = internalQuery({
  handler: async (ctx): Promise<Doc<"users"> | null> => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return null;
    }

    const user = await ctx.runQuery(internal.users.getByAuthId, {
      authId: identity.subject,
    });

    if (!user) {
      return null;
    }

    return user;
  },
});

export const current = query({
  handler: async (ctx): Promise<Doc<"users"> | null> => {
    const user = await ctx.runQuery(internal.auth.authenticate);

    if (!user) {
      return null;
    }

    return user;
  },
});
