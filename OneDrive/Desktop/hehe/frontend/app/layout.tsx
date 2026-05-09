import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { SessionExpiryProvider } from "@/components/session-expiry-provider";
import "./globals.css";
import "../bones/registry";

export const metadata: Metadata = {
  title: "Postiz — Social Media Scheduling",
  description: "Schedule and analyze your social media content across all platforms.",
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
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <SessionExpiryProvider>{children}</SessionExpiryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
