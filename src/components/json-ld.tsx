// import { siteConfig } from '@/config/metadata'

// export function WebsiteJsonLd() {
//   return (
//     <script
//       type="application/ld+json"
//       dangerouslySetInnerHTML={{
//         __html: JSON.stringify({
//           "@context": "https://schema.org",
//           "@type": "WebSite",
//           name: siteConfig.name,
//           description: siteConfig.description,
//           url: siteConfig.url,
//           potentialAction: {
//             "@type": "SearchAction",
//             target: {
//               "@type": "EntryPoint",
//               urlTemplate: `${siteConfig.url}/search?q={search_term_string}`
//             },
//             "query-input": "required name=search_term_string"
//           }
//         })
//       }}
//     />
//   )
// } 