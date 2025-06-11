import {
  Outlet,
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { convexQuery, ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import { getAccessToken } from "@/lib/auth";

import { useAuth } from "@/hooks/use-auth";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  convexQueryClient: ConvexQueryClient;
  convexClient: ConvexReactClient;
}>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Zeron Chat",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&family=IBM+Plex+Sans:ital,wght@0,100..700;1,100..700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  beforeLoad: async ({ context }) => {
    const accessToken = await context.queryClient.fetchQuery({
      queryKey: ["accessToken"],
      queryFn: getAccessToken,
    });
    if (accessToken) {
      context.convexQueryClient.serverHttpClient?.setAuth(accessToken);
      await context.queryClient.ensureQueryData(
        convexQuery(api.users.getCurrent, {})
      );
    }
  },
  component: () => (
    <RootDocument>
      <AppProvider>
        <Outlet />
      </AppProvider>
    </RootDocument>
  ),
});

function AppProvider({ children }: { children: React.ReactNode }) {
  const context = Route.useRouteContext();
  return (
    <QueryClientProvider client={context.queryClient}>
      <ConvexProviderWithAuth client={context.convexClient} useAuth={useAuth}>
        {children}
      </ConvexProviderWithAuth>
    </QueryClientProvider>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="dark flex flex-col fixed inset-0">
        {children}
        <Scripts />
      </body>
    </html>
  );
}
