import Link from "next/link";
import { listPublishedPosts } from "@/lib/viewer/posts";

// Confluence를 매 요청마다 직접 조회하지 않도록 짧은 주기로 재검증한다(ISR).
export const revalidate = 60;

export default async function Home() {
  let posts: Awaited<ReturnType<typeof listPublishedPosts>> = [];
  let loadFailed = false;

  try {
    posts = await listPublishedPosts();
  } catch {
    loadFailed = true;
  }

  return (
    <main className="page">
      <h1 className="page-title">SFOOD IT Tech Blog</h1>
      <p className="page-subtitle">SFOOD IT 담당 및 AX팀을 위한 사내 기술 블로그입니다.</p>

      {loadFailed && (
        <p className="error-text">
          문서 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      )}

      {!loadFailed && posts.length === 0 && (
        <p className="empty-state">아직 게시된 문서가 없습니다.</p>
      )}

      {posts.length > 0 && (
        <ul className="doc-list">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link href={`/posts/${post.slug}`} className="doc-list-item">
                <span className="doc-list-item-title">{post.title}</span>
                {post.publishedAt && (
                  <span className="doc-list-item-meta">
                    {new Date(post.publishedAt).toLocaleDateString("ko-KR")}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
