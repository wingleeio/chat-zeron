import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    CLERK_SECRET_KEY: z.string(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
