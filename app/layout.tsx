import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    metadataBase: new URL(origin),
    title: "BlueLine Busan | Safer coastal travel",
    description: "Plan Busan’s coast with traveler-friendly routes, nearby care and safety prompts.",
    openGraph: {
      title: "BlueLine Busan | Sea the city safely",
      description: "Routes, nearby care and coastal safety prompts for independent travelers.",
      type: "website",
      images: [{ url: `${origin}/og.png`, width: 1536, height: 1024, alt: "BlueLine Busan coastal travel safety guide" }],
    },
    twitter: { card: "summary_large_image", title: "BlueLine Busan | Sea the city safely", description: "Routes, nearby care and coastal safety prompts." },
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
