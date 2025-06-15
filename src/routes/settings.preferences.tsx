import { FormSection } from "@/components/form/form-section";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { toast } from "sonner";
import { convexQuery } from "@convex-dev/react-query";

export const Route = createFileRoute("/settings/preferences")({
  component: RouteComponent,
  loader: async ({ context }) => {
    const user = await context.queryClient.fetchQuery(
      convexQuery(api.users.getCurrent, {})
    );
    return {
      user,
    };
  },
});

function RouteComponent() {
  const { user } = Route.useLoaderData();
  const updatePreferences = useMutation(api.users.updatePreferences);

  const form = useForm({
    defaultValues: {
      nickname: user?.preferences?.nickname ?? "",
      biography: user?.preferences?.biography ?? "",
      instructions: user?.preferences?.instructions ?? "",
    },
    onSubmit: async ({ value }) => {
      try {
        await updatePreferences({
          preferences: {
            nickname: value.nickname,
            biography: value.biography,
            instructions: value.instructions,
          },
        });
        toast.success("Your preferences have been saved.");
      } catch (error) {
        toast.error("Failed to save preferences. Please try again.");
      }
    },
    validators: {
      onChange: z.object({
        nickname: z.string().min(0),
        biography: z.string().min(0),
        instructions: z.string().min(0),
      }),
    },
  });

  return (
    <form
      className="flex flex-col gap-8 w-full md:max-w-3xl mx-auto flex-1 py-8"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <FormSection
        title="Preferences"
        description="Customize your preferences here."
      >
        <form.Field
          name="nickname"
          children={(field) => (
            <div className="flex flex-col gap-2">
              <Label htmlFor="nickname">Nickname</Label>
              <Input
                id="nickname"
                placeholder="Enter your nickname"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                What do you want Zeron Chat to call you?
              </p>
            </div>
          )}
        />
        <form.Field
          name="biography"
          children={(field) => (
            <div className="flex flex-col gap-2">
              <Label htmlFor="biography">Biography</Label>
              <Textarea
                id="biography"
                className="resize-none"
                placeholder="Enter your biography"
                rows={5}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                What should Zeron Chat know about you?
              </p>
            </div>
          )}
        />
      </FormSection>
      <Separator />
      <FormSection
        title="System"
        description="Customize your system prompt here."
      >
        <form.Field
          name="instructions"
          children={(field) => (
            <div className="flex flex-col gap-2">
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                className="resize-none"
                placeholder="Enter your instructions"
                rows={5}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                How do you want Zeron Chat to behave?
              </p>
            </div>
          )}
        />
      </FormSection>
      <div className="flex justify-end">
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}
