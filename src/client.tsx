import { hydrateRoot } from 'react-dom/client'
import { StartClient } from '@tanstack/react-start'
import { PostHogProvider } from 'posthog-js/react'

import { createRouter } from './router'
import { env } from './env.client'

const router = createRouter()

hydrateRoot(
  document,
  <PostHogProvider
    apiKey={env.VITE_PUBLIC_POSTHOG_KEY}
    options={{
      api_host: env.VITE_PUBLIC_POSTHOG_HOST,
      capture_exceptions: true,
      debug: import.meta.env.MODE === 'development'
    }}
  >
    <StartClient router={router} />
  </PostHogProvider>
)