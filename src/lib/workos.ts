import { env } from "@/env.server";
import { lazy } from "@/lib/utils";
import { WorkOS } from "@workos-inc/node";

function createWorkOS() {
  return new WorkOS(env.WORKOS_API_KEY, {
    clientId: env.WORKOS_CLIENT_ID,
  });
}

export const getWorkOS = lazy(createWorkOS);
