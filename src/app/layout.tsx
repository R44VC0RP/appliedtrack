import { ClerkThemeProvider } from '@/components/providers/clerk-theme-provider'
import './globals.css'
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'


const ApfelGrotezk = localFont({
  src: [
    {
      path: 'fonts/Apfel/ApfelGrotezk-Regular.woff',
      weight: '400',
      style: 'normal',
    },
    {
      path: 'fonts/Apfel/ApfelGrotezk-Mittel.woff',
      weight: '700',
      style: 'bold',
    },
  ],
  variable: '--font-apfel-grotezk',
})

// Add alternative fonts for testing
const interFont = Inter({ subsets: ['latin'] })

// Font selection logic
const getFontClass = () => {
  const fontSelection = 'apfel'
  
  switch (fontSelection.toLowerCase()) {
    case 'apfel':
      return ApfelGrotezk.className
    case 'inter':
    default:
      return interFont.className
  }
}

import type { Metadata } from 'next'

import { ThemeProvider } from "@/components/theme-provider"
import Script from 'next/script'
import { siteConfig } from '@/config/metadata'
import { Toaster } from "@/components/ui/sonner"

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const fontClass = getFontClass()
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          src="https://analytics.raavai.com/script.js"
          data-website-id="063b39c4-dbaf-4efa-8a86-7a481ba06483"
          strategy="lazyOnload"
        />
      </head>
      <body className={`${fontClass} dark:bg-gray-950 text-base antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClerkThemeProvider>
            {children}
            <Toaster />
          </ClerkThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
