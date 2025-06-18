import { FormSection } from "@/components/form/form-section";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { api } from "convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CheckoutLink } from "@convex-dev/polar/react";
import { useAction } from "convex/react";
import { IconCheck } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";

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
          <div className="flex flex-col gap-4 bg-muted/50 p-4 rounded-lg border">
            <h3 className="text-sm font-medium">Free</h3>
            <div className="flex gap-2 items-center">
              <p className="text-sm font-medium">$0</p>
              <p className="text-sm text-muted-foreground">/month</p>
            </div>
            <p className="text-sm text-muted-foreground">
              The essential features of Zeron.
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1">
                <p className="text-sm text-muted-foreground flex gap-2 items-center">
                  <IconCheck className="!size-4 text-primary" /> Unlimited chats
                </p>
                <p className="text-sm text-muted-foreground flex gap-2 items-center">
                  <IconCheck className="!size-4 text-primary" /> Image
                  Generation
                </p>
                <p className="text-sm text-muted-foreground flex gap-2 items-center">
                  <IconCheck className="!size-4 text-primary" /> Search Tool
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4 bg-muted/50 p-4 rounded-lg border-primary/50 border">
            <div className="flex gap-2 items-center justify-between">
              <h3 className="text-sm font-medium">Pro</h3>
              <Badge variant="secondary">Recommended</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Gain access to premium models, research tool, and more.
            </p>
            <div className="flex gap-2 items-center">
              <p className="text-sm font-medium">$10</p>
              <p className="text-sm text-muted-foreground">/month</p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1">
                <p className="text-sm text-muted-foreground flex gap-2 items-center">
                  <IconCheck className="!size-4 text-primary" /> Premium models
                </p>
                <p className="text-sm text-muted-foreground flex gap-2 items-center">
                  <IconCheck className="!size-4 text-primary" /> Unlimited chats
                </p>
                <p className="text-sm text-muted-foreground flex gap-2 items-center">
                  <IconCheck className="!size-4 text-primary" /> Image
                  Generation
                </p>
                <p className="text-sm text-muted-foreground flex gap-2 items-center">
                  <IconCheck className="!size-4 text-primary" /> Search Tool
                </p>
                <p className="text-sm text-muted-foreground flex gap-2 items-center">
                  <IconCheck className="!size-4 text-primary" /> Research Tool
                </p>
              </div>
            </div>

            {user?.isFree && (
              <div>
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
              <div>
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
        </div>
      </FormSection>
    </div>
  );
}
