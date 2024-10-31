import { siteConfig } from '@/config/metadata'

export function CanonicalUrl({ path }: { path: string }) {
  const canonicalUrl = `${siteConfig.url}${path}`
  
  return <link rel="canonical" href={canonicalUrl} />
} 