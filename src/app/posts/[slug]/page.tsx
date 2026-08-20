import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedPostBySlug, PublishedPostDetail } from "@/lib/viewer/posts";
import { NotFoundError } from "@/lib/errors";
import { RELATED_SITES } from "@/lib/viewer/related-sites";
import { auth } from "@/lib/auth";
import { CommentSection } from "@/components/comments/CommentSection";

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
      <main className="page">
        <p className="error-text">
          문서를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      </main>
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

  const visibleRelatedSites = RELATED_SITES.filter((site) => site.url);
  const session = await auth();

  return (
    <main className="page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article>
        <h1 className="page-title">{post.title}</h1>
        {post.publishedAt && (
          <p className="page-subtitle">
            {new Date(post.publishedAt).toLocaleDateString("ko-KR")}
          </p>
        )}

        <div
          className="viewer-content"
          dangerouslySetInnerHTML={{ __html: post.html }}
        />
      </article>

      {post.relatedPosts.length > 0 && (
        <section className="card">
          <h2>관련 글</h2>
          <ul className="doc-list">
            {post.relatedPosts.map((related) => (
              <li key={related.slug}>
                <Link href={`/posts/${related.slug}`} className="doc-list-item">
                  <span className="doc-list-item-title">{related.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {visibleRelatedSites.length > 0 && (
        <section className="card">
          <h2>연관 사이트</h2>
          <ul className="doc-list">
            {visibleRelatedSites.map((site) => (
              <li key={site.name}>
                <a href={site.url} className="doc-list-item">
                  {site.name}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <CommentSection pageId={post.pageId} isLoggedIn={Boolean(session?.user)} />
    </main>
  );
}
