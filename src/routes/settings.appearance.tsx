import { FormSection } from "@/components/form/form-section";
import { RadioCard } from "@/components/form/radio-card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup } from "@/components/ui/radio-group";
import { SunIcon } from "lucide-react";
import { MoonIcon } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "convex/_generated/api";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

const userQuery = convexQuery(api.users.getCurrent, {});
export const Route = createFileRoute("/settings/appearance")({
  component: RouteComponent,

  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(userQuery);
  },

  head: () => ({
    meta: [
      {
        title: "Appearance | Zeron",
      },
    ],
  }),
});

const themes = [
  {
    name: "Default",
    value: "default",
  },
  {
    name: "T3 Chat",
    value: "t3-chat",
  },
  {
    name: "Claymorphism",
    value: "claymorphism",
  },
];

function RouteComponent() {
  const queryClient = useQueryClient();
  const { data: user } = useSuspenseQuery(userQuery);

  const updateAppearance = useMutation({
    mutationFn: useConvexMutation(api.users.updateAppearance),
    onMutate: (data: {
      appearance: {
        mode?: "light" | "dark" | undefined;
        theme?: string | undefined;
      };
    }) => {
      queryClient.setQueryData(userQuery.queryKey, (old: any) => {
        return {
          ...old,
          appearance: {
            ...old.appearance,
            ...data.appearance,
          },
        };
      });
    },
  });

  const mode = user?.appearance?.mode ?? "dark";
  const theme = user?.appearance?.theme ?? "default";

  return (
    <div className="flex flex-col gap-8">
      <FormSection title="Mode" description="Select your preferred mode.">
        <RadioGroup
          className="grid grid-cols-2 gap-4"
          value={mode}
          onValueChange={(value) => {
            updateAppearance.mutate({
              appearance: {
                mode: value as any,
                theme: theme,
              },
            });
          }}
        >
          <RadioCard id="light" value="light" className="col-span-1">
            <SunIcon className="h-4 w-4" />
            Light
          </RadioCard>
          <RadioCard id="dark" value="dark" className="col-span-1">
            <MoonIcon className="h-4 w-4" />
            Dark
          </RadioCard>
        </RadioGroup>
      </FormSection>
      <Separator />
      <FormSection title="Theme" description="Select your theme.">
        <RadioGroup
          className="grid gap-4"
          value={theme}
          onValueChange={(value) => {
            updateAppearance.mutate({
              appearance: {
                theme: value,
                mode: mode,
              },
            });
          }}
        >
          {themes.map((theme) => (
            <RadioCard
              key={theme.value}
              id={theme.value}
              value={theme.value}
              className="col-span-1 flex-row justify-start"
            >
              <span>{theme.name}</span>
            </RadioCard>
          ))}
        </RadioGroup>
      </FormSection>
    </div>
  );
}
