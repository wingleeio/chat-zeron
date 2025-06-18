import { FormSection } from "@/components/form/form-section";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { api } from "convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CheckoutLink, CustomerPortalLink } from "@convex-dev/polar/react";
import { useAction } from "convex/react";

const productsQuery = convexQuery(api.polar.listAllProducts, {});

export const Route = createFileRoute("/settings/")({
  component: RouteComponent,

  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(productsQuery);
  },

  head: () => ({
    meta: [
      {
        title: "Account | Zeron",
      },
    ],
  }),
});

function RouteComponent() {
  const { data: user } = useCurrentUser();

  const { data: products } = useSuspenseQuery(productsQuery);

  const generateCustomerPortalUrl = useAction(
    api.polar.generateCustomerPortalUrl
  );

  return (
    <div className="flex flex-col gap-8 w-full">
      <FormSection title="Subscription" description="Manage your subscription.">
        <div className="space-y-4">
          {user?.isFree && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mt-1">
                You are currently on the free plan.
              </p>
              <Button variant="outline" asChild>
                <CheckoutLink
                  polarApi={api.polar}
                  productIds={products.map((product) => product.id)}
                  embed={false}
                >
                  Upgrade to Pro
                </CheckoutLink>
              </Button>
            </div>
          )}
          {user?.isPremium && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mt-1">
                You have access to all premium features.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  generateCustomerPortalUrl().then(({ url }) => {
                    window.location.href = url;
                  });
                }}
              >
                Manage Subscription
              </Button>
            </div>
          )}
        </div>
      </FormSection>
    </div>
  );
}
