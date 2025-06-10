import { env } from "@/env.server";
import { getWorkOS } from "@/lib/workos";
import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { setCookie } from "@tanstack/react-start/server";

export const APIRoute = createAPIFileRoute("/api/auth/callback")({
  GET: async ({ request }) => {
    const code = new URL(request.url).searchParams.get("code");

    if (!code) {
      return json({ error: "No code provided" }, { status: 400 });
    }

    try {
      const response = await getWorkOS().userManagement.authenticateWithCode({
        clientId: env.WORKOS_CLIENT_ID,
        code,
        session: {
          sealSession: true,
          cookiePassword: env.WORKOS_COOKIE_PASSWORD,
        },
      });

      setCookie(env.WORKOS_COOKIE_NAME, response.sealedSession!, {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "lax",
      });

      return new Response(null, {
        status: 307,
        headers: {
          Location: "/",
        },
      });
    } catch (e) {
      return json(
        { error: "Failed to exchange code for token" },
        { status: 500 }
      );
    }
  },
});
