import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedPostBySlug, PublishedPostDetail } from "@/lib/viewer/posts";
import { NotFoundError } from "@/lib/errors";
import { auth } from "@/lib/auth";
import { getAxAuthLoginUrl } from "@/lib/ax-auth/client";
import { CommentSection } from "@/components/comments/CommentSection";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

// Confluence를 매 요청마다 직접 조회하지 않도록 짧은 주기로 재검증한다(ISR).
export const revalidate = 60;

async function loadPost(slug: string): Promise<PublishedPostDetail | "not-found" | "error"> {
  try {
    return await getPublishedPostBySlug(slug);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return "not-found";
    }
    return "error";
  }
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadPost(slug);

  if (post === "not-found" || post === "error") {
    return { title: "SFOOD IT Tech Blog" };
  }

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

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await loadPost(slug);

  if (post === "not-found") {
    notFound();
  }

  if (post === "error") {
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
