import type { Metadata } from "next";
import { listPublishedPosts } from "@/lib/viewer/posts";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PostCard } from "@/components/posts/PostCard";

interface TagPageProps {
  params: Promise<{ tag: string }>;
}

// Confluence를 매 요청마다 직접 조회하지 않도록 짧은 주기로 재검증한다(ISR, 홈/상세와 동일).
export const revalidate = 60;

/**
 * Confluence 레이블은 태그 목록 API가 아니라 게시 문서에 붙은 값 그대로이므로, 대소문자가
 * 항상 같은 표기로 온다는 보장이 없다 — URL의 태그와는 소문자로 정규화해 비교한다.
 */
async function loadTaggedPosts(tag: string) {
  const posts = await listPublishedPosts();
  const normalized = tag.toLowerCase();
  return posts.filter((post) =>
    post.tags.some((postTag) => postTag.toLowerCase() === normalized)
  );
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { tag } = await params;
  return { title: `#${decodeURIComponent(tag)} — SFOOD IT Tech Blog` };
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);

  let posts: Awaited<ReturnType<typeof loadTaggedPosts>> = [];
  let loadFailed = false;
  try {
    posts = await loadTaggedPosts(decodedTag);
  } catch {
    loadFailed = true;
  }

  return (
    <>
      <div className="wrap">
        <SiteHeader variant="detail" />

        <h1 className="section-heading" style={{ marginTop: 24 }}>
          #{decodedTag}
        </h1>

        {loadFailed && (
          <p className="error-text" style={{ margin: "24px 0" }}>
            게시글 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </p>
        )}

        {!loadFailed && posts.length === 0 && (
          <p className="empty-state">이 태그가 붙은 게시글이 없습니다.</p>
        )}

        {posts.length > 0 && (
          <div className="card-grid" style={{ marginTop: 16 }}>
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </div>

      <SiteFooter />
    </>
  );
}
