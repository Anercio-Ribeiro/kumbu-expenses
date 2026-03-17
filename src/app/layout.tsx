import type { Metadata } from 'next'
import { Sora } from 'next/font/google'
import { JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { QueryProvider } from '@/store/query-provider'
import '@/styles/globals.css'

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'Kanza — Gestão Financeira', template: '%s | Kanza' },
  description: 'Controla as tuas finanças pessoais em Kwanza angolano',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body className={`${sora.variable} ${jetbrains.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <QueryProvider>
            {children}
            <Toaster
              richColors
              position="bottom-right"
              toastOptions={{
                style: { fontFamily: 'var(--font-sora)' },
                duration: 3000,
              }}
            />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
