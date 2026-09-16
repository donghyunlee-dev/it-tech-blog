import { listPublishedPosts } from "@/lib/viewer/posts";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Hero } from "@/components/posts/Hero";
import { PostCard } from "@/components/posts/PostCard";
import { RecentCommentsSidebar } from "@/components/posts/RecentCommentsSidebar";

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

            <RecentCommentsSidebar items={[]} />
          </div>
        )}
      </div>

      <SiteFooter />
    </>
  );
}
