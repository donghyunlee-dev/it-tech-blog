import type { MetadataRoute } from "next";

function getSiteBaseUrl(): string {
  return process.env.SITE_BASE_URL || "http://localhost:3000";
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteBaseUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
