import type { MetadataRoute } from "next";

/**
 * Next.js web app manifest route handler.
 * Generates `/manifest.webmanifest` at build time with PWA metadata,
 * icon declarations, and the Web Share Target configuration that allows
 * other apps to share receipt files directly into this app.
 * @returns The manifest object defining the PWA configuration.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Receipt Extractor",
    short_name: "Receipt Extractor",
    description:
      "Extract structured data from receipt images and PDFs using AI",
    start_url: "/",
    display: "standalone",
    theme_color: "#2563EB",
    background_color: "#F9FAFB",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    share_target: {
      action: "/share-target",
      method: "POST",
      enctype: "multipart/form-data",
      params: {
        files: [
          {
            name: "receipt",
            accept: [
              "image/jpeg",
              "image/png",
              "image/webp",
              "application/pdf",
              "image/*",
            ],
          },
        ],
      },
    },
  };
}
