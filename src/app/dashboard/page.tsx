import { AppliedTrack } from "@/components/dashboard-applications";
import { Metadata } from 'next'
import { siteConfig } from '@/config/metadata'

export default function Dashboard() {
  return (
    <div>
      <AppliedTrack />
    </div>
  )
}

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Track and manage your job applications in one place",
  openGraph: {
    title: "AppliedTrack Dashboard",
    description: "Your personal job application tracking dashboard",
    images: [
      {
        url: `${siteConfig.url}/api/og?title=Dashboard&type=job`,
        width: 1200,
        height: 630,
        alt: "AppliedTrack Dashboard"
      }
    ]
  }
}
