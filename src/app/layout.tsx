import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { Inter } from 'next/font/google'
import type { Metadata } from 'next'
import { Toaster } from "@/components/ui/toaster"


const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "Job Tracker",
  description: "Track your job applications",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
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
