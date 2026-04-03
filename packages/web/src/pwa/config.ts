import { AppBranding } from "@hr-attendance-app/types";

/** PWA manifest configuration — uses centralized AppBranding. */
export const PWA_CONFIG = {
  name: AppBranding.appName,
  short_name: AppBranding.appShortName,
  theme_color: AppBranding.themeColor,
  background_color: "#FFFFFF",
  display: "standalone" as const,
  start_url: "/",
  icons: [
    { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
} as const;
