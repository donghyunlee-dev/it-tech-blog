import { listPublishedPosts } from "@/lib/viewer/posts";
import { getSiteBaseUrl } from "@/lib/site";

// Confluence를 매 요청마다 직접 조회하지 않도록 짧은 주기로 재검증한다(ISR).
export const revalidate = 60;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const baseUrl = getSiteBaseUrl();

  let posts: Awaited<ReturnType<typeof listPublishedPosts>> = [];
  try {
    posts = await listPublishedPosts();
  } catch {
    posts = [];
  }

  const items = posts
    .map((post) => {
      const url = `${baseUrl}/posts/${post.slug}`;
      const pubDate = post.publishedAt
        ? new Date(post.publishedAt).toUTCString()
        : new Date(0).toUTCString();
      return `  <item>
    <title>${escapeXml(post.title)}</title>
    <link>${url}</link>
    <guid>${url}</guid>
    <pubDate>${pubDate}</pubDate>
  </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>SFOOD IT Tech Blog</title>
  <link>${baseUrl}</link>
  <description>SFOOD IT 담당 및 AX팀을 위한 사내 기술 블로그</description>
${items}
</channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
