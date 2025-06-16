import { Polar } from "@convex-dev/polar";
import { components, internal } from "convex/_generated/api";

export const polar = new Polar(components.polar, {
  getUserInfo: async (ctx): Promise<{ userId: string; email: string }> => {
    const user = await ctx.runQuery(internal.auth.authenticate);

    if (!user) {
      throw new Error("User not authenticated");
    }

    return {
      userId: user._id,
      // email is optional in schema because we started this app with no emails
      // TODO: migration for this
      email: user.email!,
    };
  },
});

export const {
  changeCurrentSubscription,
  cancelCurrentSubscription,
  getConfiguredProducts,
  listAllProducts,
  generateCheckoutLink,
  generateCustomerPortalUrl,
} = polar.api();
