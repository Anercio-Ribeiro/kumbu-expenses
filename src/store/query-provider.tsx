'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,          // 1 minute
            gcTime: 5 * 60 * 1000,         // 5 minutes
            retry: 2,
            refetchOnWindowFocus: false,
          },
          mutations: {
            onError: (err) => {
              console.error('[Mutation error]', err)
            },
          },
        },
      }),
  )

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
