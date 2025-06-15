import { FormSection } from "@/components/form/form-section";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col gap-8 w-full">
      <FormSection title="Subscription" description="Manage your subscription.">
        <p className="text-sm text-muted-foreground">
          You are currently on the free plan.
        </p>
      </FormSection>
    </div>
  );
}
