import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://blueline-busan-coast.workspace-925535.chatgpt.site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "BlueLine Busan | Safer coastal travel",
  description: "Plan Busan coast with traveler-friendly routes, nearby care and safety prompts.",
  openGraph: {
    title: "BlueLine Busan | Sea the city safely",
    description: "Routes, nearby care and coastal safety prompts for independent travelers.",
    type: "website",
    images: [{ url: `${siteUrl}/og.png`, width: 1536, height: 1024, alt: "BlueLine Busan coastal travel safety guide" }],
  },
  twitter: { card: "summary_large_image", title: "BlueLine Busan | Sea the city safely", description: "Routes, nearby care and coastal safety prompts." },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
