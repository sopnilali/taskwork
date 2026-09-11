import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TaskTimer — Free Online Task Timer",
    short_name: "TaskTimer",
    description: "Free online task timer to track work time, manage hourly earnings, and boost productivity.",
    start_url: "/",
    display: "standalone",
    background_color: "#f9fafb",
    theme_color: "#6366f1",
    icons: [
      { src: "/tasktimer-logo.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/tasktimer-logo.svg", sizes: "192x192", type: "image/svg+xml", purpose: "maskable" },
    ],
    categories: ["productivity", "utilities"],
    lang: "en",
  };
}
