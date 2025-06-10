import { internal } from "convex/_generated/api";
import type { Doc } from "convex/_generated/dataModel";
import { httpAction, internalQuery } from "convex/_generated/server";
import { v } from "convex/values";
import { match } from "ts-pattern";

export const workosWebhook = httpAction(async (ctx, request) => {
  const bodyText = await request.text();
  const sigHeader = String(request.headers.get("workos-signature"));

  const results = await ctx.runAction(internal.workos.verifyWebhook, {
    payload: bodyText,
    signature: sigHeader,
  });

  return match(results)
    .with({ event: "user.created" }, async ({ data }) => {
      const user = await ctx.runQuery(internal.users.getByAuthId, {
        authId: data.id,
      });

      if (user) {
        return Response.json(
          {
            status: "error",
            message: "User already exists",
            metadata: {
              id: user._id,
            },
          },
          { status: 400 }
        );
      }

      await ctx.runMutation(internal.users.create, {
        authId: data.id,
      });

      return Response.json({ status: "success" });
    })
    .with({ event: "user.deleted" }, async ({ data }) => {
      const user = await ctx.runQuery(internal.users.getByAuthId, {
        authId: data.id,
      });

      if (!user) {
        return Response.json(
          {
            status: "error",
            message: "User not found",
            metadata: { id: data.id },
          },
          { status: 404 }
        );
      }

      await ctx.runMutation(internal.users.destroy, {
        id: user._id,
      });

      return Response.json({ status: "success" });
    })
    .otherwise(() => Response.json({ status: "success" }));
});

export const jwks = httpAction(async () => {
  const response = await fetch(
    `https://${process.env.WORKOS_API_HOSTNAME}/sso/jwks/${process.env.WORKOS_CLIENT_ID}`
  );
  const jwks = await response.json();
  return Response.json(jwks);
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
