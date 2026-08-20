import type { MetadataRoute } from "next";
import { listPublishedPosts } from "@/lib/viewer/posts";
import { getSiteBaseUrl } from "@/lib/site";

// Confluence를 매 요청마다 직접 조회하지 않도록 짧은 주기로 재검증한다(ISR).
export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteBaseUrl();

  let posts: Awaited<ReturnType<typeof listPublishedPosts>> = [];
  try {
    posts = await listPublishedPosts();
  } catch {
    posts = [];
  }

  return [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    ...posts.map((post) => ({
      url: `${baseUrl}/posts/${post.slug}`,
      lastModified: post.publishedAt || undefined,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
