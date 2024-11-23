import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { Inter } from 'next/font/google'
import type { Metadata } from 'next'

import { ThemeProvider } from "@/components/theme-provider"
import Script from 'next/script'
import { siteConfig } from '@/config/metadata'
import { Toaster } from "@/components/ui/sonner"
import { srv_initQuotaResetSchedule } from '@/lib/scheduler'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: siteConfig.authors,
  creator: siteConfig.creator,
  icons: siteConfig.icons,
  manifest: siteConfig.manifest,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: '@appliedtrack',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  try {
    const { default: dbConnect } = await import('@/lib/mongodb')
    await dbConnect()
  } catch (error) {
    console.warn('MongoDB connection failed during build:', error)
  }

  // Initialize the scheduler when the app starts
  if (process.env.NODE_ENV === 'production') {
    srv_initQuotaResetSchedule();
  }

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <Script
            src="https://analytics.raavai.com/script.js"
            data-website-id="063b39c4-dbaf-4efa-8a86-7a481ba06483"
            strategy="lazyOnload"
          />
        </head>
        <body className={`${inter.className} dark:bg-gray-950`} suppressHydrationWarning>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
