import Link from "next/link";

export interface RecentCommentItem {
  commentId: string;
  quote: string;
  authorName: string;
  postSlug: string;
  postTitle: string;
}

/**
 * 랭킹/조회수 대신 "최근 댓글"을 보여준다(design-direction.md: 경쟁이 아니라 공유와 전달).
 * 전체 게시글에 걸친 댓글 집계 API가 아직 없어(docs/tasks/viewer-editorial-ui/spec.md
 * Out of Scope 참고) 현재는 항상 빈 배열이 전달되며, 데이터가 없으면 섹션 자체를 그리지 않는다.
 */
export function RecentCommentsSidebar({ items }: { items: RecentCommentItem[] }) {
  if (items.length === 0) return null;

  return (
    <aside className="sidebar">
      <h2 className="section-heading">최근 댓글</h2>
      <ul className="recent-list">
        {items.map((item) => (
          <li key={item.commentId}>
            <Link href={`/posts/${item.postSlug}`} className="recent-item">
              <p className="recent-quote">{item.quote}</p>
              <div className="recent-meta">
                {item.authorName} · <span className="recent-post-title">{item.postTitle}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
