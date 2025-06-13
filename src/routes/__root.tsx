import {
  Outlet,
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { ConvexReactClient } from "convex/react";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/sonner";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/sidebar";
import { AppHeader } from "@/components/app/header";

import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth } from "@clerk/tanstack-react-start";
import { fetchClerkAuth } from "@/lib/auth";
import { api } from "convex/_generated/api";

export type RouterContext = {
  queryClient: QueryClient;
  convexQueryClient: ConvexQueryClient;
  convexClient: ConvexReactClient;
};

export const Route = createRootRouteWithContext<RouterContext>()({
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
    const auth = await fetchClerkAuth().catch((e) => ({
      userId: null,
      token: null,
    }));
    const { userId, token } = auth;

    if (token) {
      context.convexQueryClient.serverHttpClient?.setAuth(token);
    }

    return {
      userId,
      token,
    };
  },

  loader: async ({ context }) => {
    context.convexClient.setAuth(async () => context.token);
    const chats = await context.convexClient.query(api.chats.getPaginated, {
      paginationOpts: {
        cursor: null,
        numItems: 20,
      },
    });

    return { chats };
  },

  component: () => (
    <RootDocument>
      <AppProvider>
        <SidebarProvider>
          <AppSidebar />
          <main className="flex-1 relative">
            <div className="flex flex-col absolute inset-0">
              <AppHeader />
              <Outlet />
            </div>
          </main>
          <Toaster position="top-center" />
        </SidebarProvider>
      </AppProvider>
    </RootDocument>
  ),
});

function AppProvider({ children }: { children: React.ReactNode }) {
  const context = Route.useRouteContext();
  return (
    <ClerkProvider>
      <QueryClientProvider client={context.queryClient}>
        <ConvexProviderWithClerk
          client={context.convexClient}
          useAuth={useAuth}
        >
          {children}
        </ConvexProviderWithClerk>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head suppressHydrationWarning>
        <HeadContent />
      </head>
      <body className="dark flex flex-col fixed inset-0">
        {children}
        <Scripts />
      </body>
    </html>
  );
}
