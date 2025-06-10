import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    WORKOS_REDIRECT_URI: z.string().url(),
    WORKOS_API_KEY: z.string(),
    WORKOS_CLIENT_ID: z.string(),
    WORKOS_COOKIE_PASSWORD: z.string(),
    WORKOS_COOKIE_NAME: z.string(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
