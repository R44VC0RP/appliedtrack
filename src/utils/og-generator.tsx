import { ImageResponse } from "next/og";
import { siteConfig } from '@/config/metadata';

// Image metadata
export const size = {
  width: 1200,
  height: 630,
};

// Image generation
export async function GenerateImage(params: {
  title: string;
  description?: string;
  type?: 'default' | 'blog' | 'job';
}) {
  // Fonts
  const interSemiBold = fetch(
    new URL("../fonts/Inter-SemiBold.ttf", import.meta.url)
  ).then((res) => res.arrayBuffer());
  const interLight = fetch(
    new URL("../fonts/Inter-Light.ttf", import.meta.url)
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(to bottom right, #000000, #1a1a1a)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            color: "white",
            fontFamily: "Inter, sans-serif",
            gap: "24px",
          }}
        >
          <div style={{ fontSize: "64px", fontWeight: 600, lineHeight: 1.2 }}>
            {params.title}
          </div>
          {params.description && (
            <div style={{ fontSize: "32px", fontWeight: 300, color: "#9ca3af" }}>
              {params.description}
            </div>
          )}
          
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Inter",
          data: await interSemiBold,
          style: "normal",
          weight: 600,
        },
        {
          name: "Inter",
          data: await interLight,
          style: "normal",
          weight: 300,
        },
      ],
    }
  );
}