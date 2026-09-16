import { listPublishedPosts } from "@/lib/viewer/posts";
import { listRecentComments } from "@/lib/comments/comments";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Hero } from "@/components/posts/Hero";
import { PostCard } from "@/components/posts/PostCard";
import { RecentCommentsSidebar } from "@/components/posts/RecentCommentsSidebar";

const RECENT_COMMENTS_LIMIT = 4;
// 게시 문서 수가 늘어나도 홈 로드 시 댓글 조회 API 호출 횟수가 무한정 늘지 않도록, 최신순으로
// 정렬된 목록에서 최근 N개 문서만 훑는다(전체를 훑던 이전 구조의 확장성 문제 — 열린 과제 참고).
// 표시 개수(4)보다 넉넉히 잡아, 가장 최근 게시물 몇 개가 우연히 댓글이 없어도 사이드바가
// 비어 보이지 않게 한다.
const RECENT_COMMENTS_SCAN_LIMIT = 10;

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

  let recentComments: Awaited<ReturnType<typeof listRecentComments>> = [];
  try {
    recentComments = await listRecentComments(
      posts.slice(0, RECENT_COMMENTS_SCAN_LIMIT),
      RECENT_COMMENTS_LIMIT
    );
  } catch {
    recentComments = [];
  }

  const [heroPost, ...restPosts] = posts;

  return (
    <>
      <div className="wrap">
        <SiteHeader variant="home" />

        {loadFailed && (
          <p className="error-text" style={{ margin: "24px 0" }}>
            문서 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </p>
        )}

        {!loadFailed && posts.length === 0 && (
          <p className="empty-state">아직 게시된 문서가 없습니다.</p>
        )}

        {heroPost && <Hero post={heroPost} />}

        {posts.length > 0 && (
          <div className="content-layout">
            <div>
              <h2 className="section-heading">최신 글</h2>
              {restPosts.length > 0 ? (
                <div className="card-grid">
                  {restPosts.map((post) => (
                    <PostCard key={post.slug} post={post} />
                  ))}
                </div>
              ) : (
                <p className="empty-state">아직 다른 글이 없습니다.</p>
              )}
            </div>

            <RecentCommentsSidebar
              items={recentComments.map((comment) => ({
                commentId: comment.commentId,
                quote: comment.quote,
                authorName: comment.authorName,
                postSlug: comment.postSlug,
                postTitle: comment.postTitle,
              }))}
            />
          </div>
        )}
      </div>

      <SiteFooter />
    </>
  );
}
