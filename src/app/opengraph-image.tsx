import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
export const alt = 'AppliedTrack'
export const size = {
  width: 1200,
  height: 630,
}
 
export const contentType = 'image/png'
 
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#030711',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src="https://appliedtrack.com/images/og-image.png" // Replace with your actual logo URL
          alt="AppliedTrack"
          style={{
            width: '400px',
          }}
        />
      </div>
    )
  )
}
