import { env } from "@/env.server";
import { getWorkOS } from "@/lib/workos";
import { createAPIFileRoute } from "@tanstack/react-start/api";

export const APIRoute = createAPIFileRoute("/api/auth/login")({
  GET: () => {
    const authorizationUrl = getWorkOS().userManagement.getAuthorizationUrl({
      provider: "authkit",
      redirectUri: env.WORKOS_REDIRECT_URI,
      clientId: env.WORKOS_CLIENT_ID,
    });

    return new Response(null, {
      status: 307,
      headers: {
        Location: authorizationUrl,
      },
    });
  },
});
