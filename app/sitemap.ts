import type { MetadataRoute } from "next";

import { createClient } from "@/components/lib/supabase/server";

const siteUrl = "https://blog.rishavkamal.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const { data: articles, error } = await supabase
    .from("articles")
    .select("slug, updated_at, published_at")
    .eq("status", "published");

  if (error) {
    console.error("Sitemap article query failed:", error);
  }

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/articles`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/topics`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const articlePages: MetadataRoute.Sitemap = (articles ?? []).map(
    (article) => ({
      url: `${siteUrl}/articles/${article.slug}`,
      lastModified: new Date(
        article.updated_at ??
          article.published_at ??
          new Date().toISOString(),
      ),
      changeFrequency: "weekly",
      priority: 0.8,
    }),
  );

  return [...staticPages, ...articlePages];
}