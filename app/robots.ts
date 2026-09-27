import type { MetadataRoute } from "next";

const siteUrl = "https://blog.rishavkamal.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard/",
        "/profile/",
        "/settings/",
        "/login",
        "/register",
        "/api/",
      ],
    },

    sitemap: `${siteUrl}/sitemap.xml`,
  };
}