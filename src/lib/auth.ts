import { env } from "@/env.server";
import { getWorkOS } from "@/lib/workos";
import { createServerFn } from "@tanstack/react-start";
import {
  getCookie,
  deleteCookie,
  setCookie,
} from "@tanstack/react-start/server";

export const getAuth = createServerFn({ method: "GET" }).handler(async () => {
  const cookie = getCookie(env.WORKOS_COOKIE_NAME);
  if (!cookie) {
    return null;
  }

  const session = getWorkOS().userManagement.loadSealedSession({
    sessionData: cookie,
    cookiePassword: env.WORKOS_COOKIE_PASSWORD,
  });

  const auth = await session.authenticate();

  if (auth.authenticated) {
    return auth;
  }

  if (auth.reason === "no_session_cookie_provided") {
    return null;
  }

  const refresh = await session.refresh();

  if (!refresh.authenticated) {
    deleteCookie(env.WORKOS_COOKIE_NAME);
    return null;
  }

  setCookie(env.WORKOS_COOKIE_NAME, refresh.sealedSession!, {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
  });

  return session.authenticate();
});

export const getAccessToken = createServerFn({ method: "GET" }).handler(
  async () => {
    const auth = await getAuth();

    if (!auth) {
      return null;
    }

    if (!auth.authenticated) {
      return null;
    }

    return auth.accessToken;
  }
);
