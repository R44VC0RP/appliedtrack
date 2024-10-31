import { GenerateImage } from "@/utils/og-generator";

export const runtime = "edge";

export const alt = "AppliedTrack";
export const contentType = "image/png";

export const size = {
  width: 1200,
  height: 630,
};

// Image generation
export default async function Image() {
  return await GenerateImage({
    title: "AppliedTrack",
    description: "Get a handle on your job applications.",
  });
}
