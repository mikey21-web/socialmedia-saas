import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { SessionExpiryProvider } from "@/components/session-expiry-provider";
import { Analytics } from "@/components/analytics";
import "./globals.css";
import "../bones/registry";

export const metadata: Metadata = {
  title: {
    default: "Diyaa AI — AI Marketing Agency for Modern Brands",
    template: "%s — Diyaa AI",
  },
  description:
    "Replace your marketing agency with 5 AI specialists that work 24/7. Plan, create, design, post, and engage — at 1/30th the cost. Start free.",
  keywords: [
    "AI social media management",
    "AI marketing agency",
    "social media scheduling",
    "AI content generation",
    "Instagram automation",
    "LinkedIn automation",
    "brand voice AI",
    "social media AI India",
  ],
  authors: [{ name: "Diyaa AI" }],
  creator: "Diyaa AI",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://diyaa.ai"),
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://diyaa.ai",
    siteName: "Diyaa AI",
    title: "Diyaa AI — AI Marketing Agency for Modern Brands",
    description:
      "Replace your marketing agency with 5 AI specialists that work 24/7. Plan, create, design, post, and engage — at 1/30th the cost.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Diyaa AI — AI Marketing Agency",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Diyaa AI — AI Marketing Agency for Modern Brands",
    description:
      "Replace your marketing agency with 5 AI specialists that work 24/7.",
    images: ["/og-image.png"],
    creator: "@diyaaai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <head>
        {/* Structured data — Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Diyaa AI",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description:
                "AI-powered social media management platform with 5 specialist AI agents for content strategy, creation, design, analytics, and engagement.",
              offers: {
                "@type": "Offer",
                price: "2999",
                priceCurrency: "INR",
              },
              url: "https://diyaa.ai",
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <SessionExpiryProvider>{children}</SessionExpiryProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
