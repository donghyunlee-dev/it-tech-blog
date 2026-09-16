import Link from "next/link";
import type { PostCardData } from "./PostCard";

/** 시그니처 ③: 홈 최상단 히어로 — 사진 대신 크기와 배경으로 무게를 준다. */
export function Hero({ post }: { post: PostCardData }) {
  return (
    <Link href={`/posts/${post.slug}`} className="hero">
      <h1 className="hero-title">{post.title}</h1>
      {post.metaDescription && <p className="hero-excerpt">{post.metaDescription}</p>}
      {post.publishedAt && (
        <div className="hero-meta">{new Date(post.publishedAt).toLocaleDateString("ko-KR")}</div>
      )}
    </Link>
  );
}
