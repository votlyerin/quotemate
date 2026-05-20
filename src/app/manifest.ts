import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "QuoteMate",
    short_name: "QuoteMate",
    description:
      "Quote any job in 60 seconds. Know your profit before you say a price.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0E1414",
    theme_color: "#10b981",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png?v=2",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png?v=2",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png?v=2",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png?v=2",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
