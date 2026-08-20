"use client";

import { useEffect, useState, type FormEvent } from "react";

interface CommentNode {
  commentId: string;
  authorName: string;
  body: string;
  createdAt: string;
  replies: CommentNode[];
}

interface CommentSectionProps {
  pageId: string;
  isLoggedIn: boolean;
  loginUrl: string | null;
}

interface CommentFormProps {
  pageId: string;
  parentCommentId?: string;
  isLoggedIn: boolean;
  loginUrl: string | null;
  onPosted: () => void;
  onCancel?: () => void;
}

const RETURN_TO_COOKIE = "ax_return_to";

function startAxAuthLogin(loginUrl: string) {
  const returnTo = `${window.location.pathname}${window.location.search}`;
  document.cookie = `${RETURN_TO_COOKIE}=${encodeURIComponent(returnTo)}; path=/; max-age=300; SameSite=Lax`;
  window.location.href = loginUrl;
}

function CommentForm({
  pageId,
  parentCommentId,
  isLoggedIn,
  loginUrl,
  onPosted,
  onCancel,
}: CommentFormProps) {
  const [body, setBody] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("saving");
    setError(null);

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId,
          parentCommentId,
          body,
          ...(isLoggedIn ? {} : { authorName, authorEmail }),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message ?? "댓글 작성에 실패했습니다.");
      }

      setBody("");
      setAuthorName("");
      setAuthorEmail("");
      onPosted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      {!isLoggedIn && loginUrl && (
        <div className="stack" style={{ gap: 8 }}>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => startAxAuthLogin(loginUrl)}
          >
            MS 계정으로 댓글 작성
          </button>
          <p className="page-subtitle" style={{ margin: 0 }}>
            또는 아래에 이름·이메일을 입력해 댓글을 남길 수 있습니다.
          </p>
        </div>
      )}

      {!isLoggedIn && (
        <div className="stack" style={{ flexDirection: "row", gap: 8 }}>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor={`authorName-${parentCommentId ?? "root"}`}>이름</label>
            <input
              id={`authorName-${parentCommentId ?? "root"}`}
              type="text"
              value={authorName}
              onChange={(event) => setAuthorName(event.target.value)}
              required
            />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor={`authorEmail-${parentCommentId ?? "root"}`}>이메일</label>
            <input
              id={`authorEmail-${parentCommentId ?? "root"}`}
              type="email"
              value={authorEmail}
              onChange={(event) => setAuthorEmail(event.target.value)}
              required
            />
          </div>
        </div>
      )}

      <div className="field">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={parentCommentId ? "답글을 입력하세요" : "댓글을 입력하세요"}
          style={{ minHeight: 80 }}
          required
        />
      </div>

      {error && <p className="error-text">{error}</p>}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="submit"
          className="button button-primary"
          disabled={status === "saving"}
        >
          {status === "saving" ? "등록 중..." : "등록"}
        </button>
        {onCancel && (
          <button type="button" className="button button-secondary" onClick={onCancel}>
            취소
          </button>
        )}
      </div>
    </form>
  );
}

function CommentItem({
  comment,
  pageId,
  isLoggedIn,
  loginUrl,
  onPosted,
}: {
  comment: CommentNode;
  pageId: string;
  isLoggedIn: boolean;
  loginUrl: string | null;
  onPosted: () => void;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);

  return (
    <li>
      <div className="card">
        <p className="doc-list-item-title">{comment.authorName}</p>
        <p style={{ whiteSpace: "pre-wrap" }}>{comment.body}</p>
        <p className="doc-list-item-meta">
          {new Date(comment.createdAt).toLocaleString("ko-KR")}
        </p>

        <button
          type="button"
          className="button button-secondary"
          onClick={() => setShowReplyForm((prev) => !prev)}
        >
          {showReplyForm ? "답글 취소" : "답글"}
        </button>

        {showReplyForm && (
          <div style={{ marginTop: 12 }}>
            <CommentForm
              pageId={pageId}
              parentCommentId={comment.commentId}
              isLoggedIn={isLoggedIn}
              loginUrl={loginUrl}
              onPosted={() => {
                setShowReplyForm(false);
                onPosted();
              }}
              onCancel={() => setShowReplyForm(false)}
            />
          </div>
        )}

        {comment.replies.length > 0 && (
          <ul className="stack" style={{ marginTop: 12, paddingLeft: 24 }}>
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.commentId}
                comment={reply}
                pageId={pageId}
                isLoggedIn={isLoggedIn}
                loginUrl={loginUrl}
                onPosted={onPosted}
              />
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

export function CommentSection({ pageId, isLoggedIn, loginUrl }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  async function loadComments() {
    setLoading(true);
    setLoadError(false);
    try {
      const response = await fetch(
        `/api/comments?pageId=${encodeURIComponent(pageId)}`
      );
      if (!response.ok) {
        throw new Error("댓글을 불러오지 못했습니다.");
      }
      const data = await response.json();
      setComments(data.comments ?? []);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 마운트 시 댓글 목록을 가져오는 표준적인 데이터 패칭 패턴
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);

  return (
    <section className="card">
      <h2>댓글</h2>

      {loading && <p className="page-subtitle">댓글을 불러오는 중...</p>}
      {!loading && loadError && (
        <p className="error-text">댓글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
      )}
      {!loading && !loadError && comments.length === 0 && (
        <p className="empty-state">아직 댓글이 없습니다.</p>
      )}

      {!loading && !loadError && comments.length > 0 && (
        <ul className="stack">
          {comments.map((comment) => (
            <CommentItem
              key={comment.commentId}
              comment={comment}
              pageId={pageId}
              isLoggedIn={isLoggedIn}
              loginUrl={loginUrl}
              onPosted={loadComments}
            />
          ))}
        </ul>
      )}

      <div style={{ marginTop: 16 }}>
        <CommentForm
          pageId={pageId}
          isLoggedIn={isLoggedIn}
          loginUrl={loginUrl}
          onPosted={loadComments}
        />
      </div>
    </section>
  );
}
