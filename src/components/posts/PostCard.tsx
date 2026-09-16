import Link from "next/link";

export interface PostCardData {
  slug: string;
  title: string;
  metaDescription: string;
  publishedAt: string;
  tags: string[];
}

export function PostCard({ post }: { post: PostCardData }) {
  return (
    <Link href={`/posts/${post.slug}`} className="post-card">
      {post.tags.length > 0 && <span className="kicker">{post.tags.join(" · ")}</span>}
      <h3 className="post-title">{post.title}</h3>
      {post.metaDescription && <p className="post-excerpt">{post.metaDescription}</p>}
      {post.publishedAt && (
        <div className="post-meta">{new Date(post.publishedAt).toLocaleDateString("ko-KR")}</div>
      )}
    </Link>
  );
}
