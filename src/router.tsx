import { createRouter as createTanstackRouter } from "@tanstack/react-router";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

import "./styles.css";
import { env } from "@/env.client";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient } from "@tanstack/react-query";
import { ConvexReactClient } from "convex/react";

// Create a new router instance
export const createRouter = () => {
  const convexClient = new ConvexReactClient(env.VITE_CONVEX_URL, {
    authRefreshTokenLeewaySeconds: 60,
  });
  const convexQueryClient = new ConvexQueryClient(convexClient);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
      },
    },
  });

  convexQueryClient.connect(queryClient);

  const router = createTanstackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 30,
    defaultPreload: "viewport",
    context: {
      convexClient,
      convexQueryClient,
      queryClient,
    },
  });

  return router;
};

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
