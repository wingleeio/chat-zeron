import { env } from "@/env.server";
import { getWorkOS } from "@/lib/workos";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { deleteCookie, getCookie } from "@tanstack/react-start/server";

export const APIRoute = createAPIFileRoute("/api/auth/logout")({
  GET: async () => {
    const session = getWorkOS().userManagement.loadSealedSession({
      sessionData: getCookie(env.WORKOS_COOKIE_NAME)!,
      cookiePassword: env.WORKOS_COOKIE_PASSWORD,
    });

    const url = await session.getLogoutUrl();

    deleteCookie(env.WORKOS_COOKIE_NAME);

    return new Response(null, {
      status: 307,
      headers: {
        Location: url,
      },
    });
  },
});
