import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { resolvePostRoute, PostRouteResult } from "@/lib/viewer/posts";
import { auth } from "@/lib/auth";
import { getAxAuthLoginUrl } from "@/lib/ax-auth/client";
import { CommentSection } from "@/components/comments/CommentSection";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

interface PostPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}

// Confluence를 매 요청마다 직접 조회하지 않도록 짧은 주기로 재검증한다(ISR).
export const revalidate = 60;

type LoadedPost = PostRouteResult | { status: "error" };

/**
 * `/api/auth/ax-callback`이 인증/댓글 저장 실패 시 붙이는 `?error=` 코드를 사람이 읽을 문구로
 * 바꾼다. 인증 실패와 저장 실패를 구분해 안내한다 — 댓글 생성 자체가 성공한 뒤 알림 메일만
 * 실패한 경우는 여기 해당하지 않는다(사용자에게는 성공으로 보이고 조용히 로그만 남는다).
 */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  comment_auth_failed: "댓글 작성자 인증에 실패해 저장되지 않았습니다. 다시 시도해 주세요.",
  comment_save_failed: "댓글 저장에 실패했습니다. 다시 입력해 주세요.",
  missing_token: "로그인에 실패했습니다. 다시 시도해 주세요.",
};

function resolveAuthErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  return AUTH_ERROR_MESSAGES[code] ?? "요청 처리 중 문제가 발생했습니다. 다시 시도해 주세요.";
}

async function loadPost(slug: string): Promise<LoadedPost> {
  try {
    return await resolvePostRoute(slug);
  } catch {
    return { status: "error" };
  }
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await loadPost(slug);

  if (result.status !== "found") {
    return { title: "SFOOD IT Tech Blog" };
  }
  const post = result.post;

  return {
    title: post.title,
    description: post.metaDescription || undefined,
    alternates: { canonical: post.canonicalUrl },
    openGraph: {
      title: post.title,
      description: post.metaDescription || undefined,
      url: post.canonicalUrl,
      type: "article",
    },
  };
}

export default async function PostPage({ params, searchParams }: PostPageProps) {
  const { slug } = await params;
  const { error } = await searchParams;
  const result = await loadPost(slug);

  // 게시 주소(slug)만 바뀐 문서 — 검색엔진·기존 링크가 링크 가치를 유지하도록 영구 리다이렉트한다.
  if (result.status === "moved") {
    permanentRedirect(`/posts/${result.currentSlug}`);
  }

  if (result.status === "not-found") {
    notFound();
  }

  if (result.status === "error") {
    return (
      <div className="wrap">
        <SiteHeader variant="detail" />
        <p className="error-text" style={{ margin: "24px 0" }}>
          문서를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </p>
        <SiteFooter />
      </div>
    );
  }

  const post = result.post;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.metaDescription || undefined,
    datePublished: post.publishedAt || undefined,
    mainEntityOfPage: post.canonicalUrl,
  };

  const session = await auth();
  const sessionEmail = session?.user?.email ?? null;

  let loginUrl: string | null = null;
  try {
    loginUrl = getAxAuthLoginUrl();
  } catch {
    loginUrl = null;
  }

  return (
    <>
      <div className="wrap">
        <SiteHeader variant="detail" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <article>
          <header className="article-header">
            {post.tags.length > 0 && (
              <span className="kicker">
                {post.tags.map((tag, index) => (
                  <span key={tag}>
                    {index > 0 && " · "}
                    <Link href={`/tags/${encodeURIComponent(tag)}`}>{tag}</Link>
                  </span>
                ))}
              </span>
            )}
            <h1 className="article-title">{post.title}</h1>
            <div className="byline">
              <div className="byline-sub">
                {post.publishedAt && new Date(post.publishedAt).toLocaleDateString("ko-KR")}
                {post.publishedAt && " · "}
                읽는 데 {post.readingMinutes}분
              </div>
            </div>
          </header>

          {post.heroImageUrl && (
            <div className="article-hero">
              {/* eslint-disable-next-line @next/next/no-img-element -- Confluence 첨부 이미지를 그대로 노출 */}
              <img src={post.heroImageUrl} alt="" />
            </div>
          )}

          <div
            className="article-body viewer-content"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />
        </article>

        {post.relatedPosts.length > 0 && (
          <section className="related-section">
            <h2 className="section-heading">관련 글</h2>
            <div className="related-list">
              {post.relatedPosts.map((related) => (
                <Link key={related.slug} href={`/posts/${related.slug}`} className="related-card">
                  <div className="related-title">{related.title}</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {resolveAuthErrorMessage(error) && (
          <p className="error-text" style={{ margin: "16px 0" }}>
            {resolveAuthErrorMessage(error)}
          </p>
        )}

        <CommentSection
          pageId={post.pageId}
          isLoggedIn={Boolean(session?.user)}
          sessionEmail={sessionEmail}
          loginUrl={loginUrl}
        />
      </div>

      <SiteFooter />
    </>
  );
}
