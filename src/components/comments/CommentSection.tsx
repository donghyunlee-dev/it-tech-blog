"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button, Card, Input, CommentThread, type Comment as SfoodComment } from "@sfood/ui";

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
  sessionEmail: string | null;
  loginUrl: string | null;
  /** AX Auth 로그인이 실패해 게스트 작성 화면으로 바로 진입해야 할 때(ax-signin-failed 참고) true. */
  startAsGuest: boolean;
}

/**
 * 댓글 작성 프로세스(2026-09-18 단순화, design-direction.md 참고. 2026-09-19 재조정).
 *
 * 화면에 "사내 직원"/"외부 방문자" 같은 구분 문구를 노출하지 않는다 — 로그인이 안 되어 있으면
 * "로그인" 버튼 하나만 보이는 화면(gate)만 있으면 된다. 클릭하면 AX Auth(MS) 로그인을 시도하고,
 * 성공하면 이메일이 잠긴 채로, 실패하면(토큰 만료·사내 계정 아님 등) 오류 화면 없이 이메일·
 * 이름을 직접 입력하는 동일한 작성 화면으로 넘어간다. 내부적으로는 여전히
 * `authorType: ms_user | external`을 구분해 저장하지만(data-spec.md), 그 구분은 화면에
 * 드러나지 않는다.
 *
 * 단계는 "gate"(로그인/비로그인 버튼) → "compose"(이메일+이름+댓글) 두 가지뿐이다.
 * "비로그인"을 누르면 이메일·이름·댓글 입력창(CommentThread의 composer) 3개를 한 번에 전부
 * 보여준다 — 이메일/이름이 비어 있어도 입력을 가리지 않고, "댓글 등록" 버튼을 눌렀을 때에만
 * 누락을 확인해 오류를 보여준다(이전에는 이메일·이름이 채워지기 전까지 textarea 자체를 숨겼는데,
 * 사용자가 뭘 더 입력해야 다음이 나오는지 알기 어려웠다).
 *
 * 주의: `@sfood/ui`의 CommentThread는 제출 시 자신의 textarea 값을 무조건 비운다. 이메일/이름
 * 누락으로 우리 쪽에서 제출을 막아도 입력했던 댓글 본문은 사라진다 — CommentThread가 textarea를
 * 컨트롤드 prop으로 노출하지 않아 이 저장소에서 막을 방법이 없는 알려진 한계다.
 *
 * "로그인 후 댓글을 남기거나" 문구 아래에 있던 "로그인"/"로그아웃" 텍스트 링크(신원 전환)는
 * 제거했다 — 게스트 작성 화면에서는 의미가 없고, 로그인 사용자에게는 로그아웃 버튼만 남긴다
 * (이 앱에서 로그아웃할 수 있는 유일한 경로라 완전히 없애지는 않았다). 2026-09-21: 그 로그아웃
 * 버튼이 필드 두 개 아래에 밑줄 텍스트 링크 하나로만 있어 존재감이 약하다는 피드백으로,
 * 로그인 상태를 실제로 보여주는 잠긴 이메일 입력 라벨 줄로 옮기고 외곽선 pill 버튼으로 바꿨다.
 */
type Stage = "gate" | "compose";

const RETURN_TO_COOKIE = "ax_return_to";
const PENDING_COMMENT_COOKIE = "ax_pending_comment";
// 쿠키 한 개당 실제 한도(약 4KB)보다 여유 있게 잡는다 — 이름/속성 오버헤드 감안.
const PENDING_COMMENT_COOKIE_MAX_LENGTH = 3500;

/**
 * `ax_pending_comment`는 `path=/`로 브라우저의 모든 탭에 공유되는 쿠키라, 어떤 AX Auth
 * 왕복이 그 초안을 "소비"해야 하는지 구분할 방법이 없다(state/nonce를 왕복시킬 수 있는
 * 파라미터가 AX Auth 로그인 시작 엔드포인트에 없음 — login-integration-guide.md 확인).
 * 평범한 로그인 트리거(게이트 버튼)는 애초에 대기 중인 댓글을 소비할 대상이 아니므로,
 * 시작 시점에 남아 있을 수 있는 값을 지워 최소한 "다른 탭의 대기 중인 댓글이 엉뚱한 계정으로
 * 잘못 게시되는" 최악의 경우는 없앤다(docs/tasks/viewer-pending-comment-crosstab/ 참고).
 * 완전히 동시에 발생하는 경쟁 상태까지 막지는 못하며, 그 경우 대기 중이던 댓글이 조용히
 * 유실될 수 있다는 잔여 위험은 감수한다.
 */
function startAxAuthLogin(loginUrl: string, options?: { clearPendingComment?: boolean }) {
  const returnTo = `${window.location.pathname}${window.location.search}`;
  document.cookie = `${RETURN_TO_COOKIE}=${encodeURIComponent(returnTo)}; path=/; max-age=300; SameSite=Lax`;
  if (options?.clearPendingComment) {
    document.cookie = `${PENDING_COMMENT_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  }
  window.location.href = loginUrl;
}

interface PendingCommentDraft {
  pageId: string;
  parentCommentId?: string;
  body: string;
  authorName: string;
}

/**
 * MS 로그인 사용자의 댓글 저장을 AX Auth 리다이렉트로 이어가기 전, 작성 중이던 내용을
 * 쿠키에 잠깐 담아둔다. login_token은 발급 시점에만 얻을 수 있어(180초·1회성), 이미
 * 세션이 있어도 댓글을 저장할 때마다 이 왕복을 거쳐야 알림 메일을 보낼 수 있다
 * (mail-integration-guide.md, docs/tasks/viewer-comment-mail-token/ 참고).
 * 쿠키 크기 한도를 넘으면 저장하지 않고 false를 반환해 호출부가 기존 방식(알림 없이 즉시
 * 저장)으로 폴백하게 한다.
 */
function storePendingComment(draft: PendingCommentDraft): boolean {
  const encoded = encodeURIComponent(JSON.stringify(draft));
  if (encoded.length > PENDING_COMMENT_COOKIE_MAX_LENGTH) return false;

  document.cookie = `${PENDING_COMMENT_COOKIE}=${encoded}; path=/; max-age=150; SameSite=Lax`;
  return true;
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function countAll(nodes: CommentNode[]): number {
  return nodes.reduce((sum, node) => sum + 1 + countAll(node.replies), 0);
}

function toSfoodComments(nodes: CommentNode[]): SfoodComment[] {
  return nodes.map((node) => ({
    id: node.commentId,
    author: { name: node.authorName },
    time: new Date(node.createdAt).toLocaleString("ko-KR"),
    body: node.body,
    replies: node.replies.length > 0 ? toSfoodComments(node.replies) : undefined,
  }));
}

export function CommentSection({
  pageId,
  isLoggedIn,
  sessionEmail,
  loginUrl,
  startAsGuest,
}: CommentSectionProps) {
  const router = useRouter();
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const verified = isLoggedIn && Boolean(sessionEmail);
  const [stage, setStage] = useState<Stage>(verified || startAsGuest ? "compose" : "gate");
  const [email, setEmail] = useState(verified ? sessionEmail! : "");
  const [name, setName] = useState(verified ? sessionEmail!.split("@")[0] : "");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);

  const identityReady = verified || (email.trim() !== "" && name.trim() !== "");

  async function loadComments() {
    setLoading(true);
    setLoadError(false);
    try {
      const response = await fetch(`/api/comments?pageId=${encodeURIComponent(pageId)}`);
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

  /** 로그인 단계로 되돌아간다 — MS 인증됐던 경우에만 세션을 실제로 정리한다. */
  async function resetToGate() {
    const wasVerified = verified;
    setEmail("");
    setName("");
    setSubmitError(null);
    setStage("gate");
    if (wasVerified) {
      setSwitching(true);
      try {
        await signOut({ redirect: false });
      } finally {
        setSwitching(false);
        router.refresh();
      }
    }
  }

  async function submitCommentDirect(
    author: { name: string; email: string; verified: boolean },
    body: string,
    parentCommentId?: string
  ) {
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId,
          parentCommentId,
          body,
          authorName: author.name,
          ...(author.verified ? {} : { authorEmail: author.email }),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message ?? "댓글 작성에 실패했습니다.");
      }
      await loadComments();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    }
  }

  async function handleSubmit(body: string, parentCommentId?: string) {
    if (!identityReady) {
      // CommentThread가 제출 시 textarea를 무조건 비우므로(위 컴포넌트 주석 참고) 입력했던
      // 댓글 본문은 여기서 이미 사라진 상태다 — 이메일/이름을 채우면 다시 작성해야 한다.
      setSubmitError("이메일과 이름을 입력해 주세요.");
      return;
    }
    setSubmitError(null);

    const author = verified
      ? { name: name.trim() || sessionEmail!.split("@")[0], email: sessionEmail!, verified: true }
      : { name: name.trim(), email: email.trim(), verified: false };

    // MS 로그인 사용자는 댓글을 저장할 때마다 AX Auth를 거쳐 신선한 login_token을 받아야
    // 알림 메일을 보낼 수 있다 — 세션이 이미 있으므로 대부분 화면 깜빡임 없이 왕복된다.
    if (author.verified && loginUrl) {
      const stored = storePendingComment({
        pageId,
        parentCommentId,
        body,
        authorName: author.name,
      });
      if (stored) {
        startAxAuthLogin(loginUrl);
        return;
      }
    }

    await submitCommentDirect(author, body, parentCommentId);
  }

  const totalCount = countAll(comments);
  const sfoodComments = toSfoodComments(comments);

  return (
    <section className="comment-section">
      <div className="comment-list-header">
        <span className="comment-count">댓글 {totalCount}개</span>
      </div>

      {stage === "gate" && (
        <Card padding="lg" className="comment-gate">
          <p className="gate-lead">로그인 후 댓글을 남기거나, 비로그인으로 바로 작성할 수 있어요.</p>
          <div className="gate-options">
            {loginUrl && (
              <Button
                variant="primary"
                onClick={() => startAxAuthLogin(loginUrl, { clearPendingComment: true })}
              >
                로그인
              </Button>
            )}
            <Button variant="secondary" onClick={() => setStage("compose")}>
              비로그인
            </Button>
          </div>
        </Card>
      )}

      {stage === "compose" && (
        <div className="comment-identity-fields">
          <div className="identity-field-group">
            <div className="identity-field-header">
              <label className="field-label" htmlFor="comment-email">
                이메일
              </label>
              {/* 로그인 상태를 보여주는 건 잠긴 이 입력 자체라, 로그아웃도 바로 옆에 둔다 —
                  게스트 작성 화면(비로그인)에는 신원 전환 개념이 없어 두지 않는다. */}
              {verified && (
                <button
                  type="button"
                  className="logout-button"
                  onClick={resetToGate}
                  disabled={switching}
                >
                  <LogoutIcon />
                  로그아웃
                </button>
              )}
            </div>
            <Input
              id="comment-email"
              type="email"
              value={email}
              disabled={verified}
              placeholder="you@example.com"
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="identity-field-group">
            <label className="field-label" htmlFor="comment-name">
              이름
            </label>
            <Input
              id="comment-name"
              type="text"
              value={name}
              placeholder={verified ? sessionEmail!.split("@")[0] : "이름"}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
        </div>
      )}

      {submitError && <p className="error-text">{submitError}</p>}
      {/* 목록 조회 실패는 작성 가능 여부와 무관하다 — 실패해도 작성창은 그대로 열어 둔다. */}
      {loadError && (
        <p className="error-text">기존 댓글을 불러오지 못했습니다. 새로고침해 주세요.</p>
      )}

      {loading ? (
        <p className="empty-state">댓글을 불러오는 중...</p>
      ) : (
        <CommentThread
          comments={sfoodComments}
          showComposer={stage === "compose"}
          composerPlaceholder="댓글을 남겨보세요"
          submitLabel="댓글 등록"
          emptyMessage={loadError ? "댓글 목록을 확인할 수 없습니다." : "아직 댓글이 없습니다."}
          onSubmit={stage === "compose" ? (body: string) => handleSubmit(body) : undefined}
          onReply={
            stage === "compose"
              ? (commentId: string, body: string) => handleSubmit(body, commentId)
              : undefined
          }
        />
      )}
    </section>
  );
}
