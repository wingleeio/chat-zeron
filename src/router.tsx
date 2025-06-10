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
  const CONVEX_URL = env.VITE_CONVEX_URL;
  const WORKOS_CLIENT_ID = env.VITE_WORKOS_CLIENT_ID;

  if (!CONVEX_URL) {
    console.error("missing envar CONVEX_URL");
  }

  if (!WORKOS_CLIENT_ID) {
    console.error("missing envar WORKOS_CLIENT_ID");
  }

  const convexClient = new ConvexReactClient(CONVEX_URL);
  const convexQueryClient = new ConvexQueryClient(convexClient);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
      },
    },
  });
  convexQueryClient.connect(queryClient);

  const router = createTanstackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
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
