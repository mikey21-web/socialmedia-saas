import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://diyaa.ai";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/landing", "/signin", "/signup", "/privacy", "/terms", "/refund"],
        disallow: [
          "/dashboard",
          "/posts",
          "/analytics",
          "/agency",
          "/settings",
          "/admin",
          "/onboarding",
          "/api/",
          "/portal/",
          "/approval/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
