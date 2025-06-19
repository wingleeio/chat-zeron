import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    AZURE_API_KEY: z.string(),
    AZURE_RESOURCE_NAME: z.string(),
    CLERK_FRONTEND_API_URL: z.string().url(),
    CLERK_SECRET_KEY: z.string(),
    CLERK_WEBHOOK_SECRET_KEY: z.string(),
    EXA_API_KEY: z.string(),
    OPENAI_API_KEY: z.string(),
    OPENROUTER_API_KEY: z.string(),
    POLAR_ORGANIZATION_TOKEN: z.string(),
    POLAR_SERVER: z.string(),
    POLAR_WEBHOOK_SECRET: z.string(),
    R2_ACCESS_KEY_ID: z.string(),
    R2_BUCKET: z.string(),
    R2_ENDPOINT: z.string().url(),
    R2_SECRET_ACCESS_KEY: z.string(),
    R2_TOKEN: z.string(),
    R2_URL: z.string().url(),
    SERPER_API_KEY: z.string(),
    TOGETHER_API_KEY: z.string(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
