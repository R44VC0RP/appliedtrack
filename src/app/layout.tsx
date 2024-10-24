import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { Inter } from 'next/font/google'
import type { Metadata } from 'next'
import { Toaster } from "@/components/ui/toaster"


const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "AppliedTrack",
  description: "Get a handle on your job applications",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script defer src="https://analytics.raavai.com/script.js" data-website-id="063b39c4-dbaf-4efa-8a86-7a481ba06483"></script>
      </head>
      <ClerkProvider>
        <body
          className={inter.className}
          data-new-gr-c-s-check-loaded=""
          data-gr-ext-installed=""
          suppressHydrationWarning
        >
          {children}
          <Toaster />
        </body>
      </ClerkProvider>
    </html>
  )
}
