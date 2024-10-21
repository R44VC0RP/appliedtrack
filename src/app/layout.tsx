import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

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
        </body>
      </ClerkProvider>
    </html>
  )
}
