"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button, Card, ColorTag, CommentThread, Input, type Comment as SfoodComment } from "@sfood/ui";

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
}

interface Identity {
  name: string;
  email: string;
  verified: boolean;
}

/**
 * 댓글 작성 프로세스: design-direction.md "댓글 작성 프로세스" 결정을 그대로 따른다.
 * 신원 확인 전에는 댓글 입력창 자체가 존재하지 않는다 — 아래 3개 stage 중
 * 한 번에 하나만 렌더링되며, 이전 stage는 조건부 렌더링으로 실제로 사라진다
 * (CSS로 숨기는 것이 아니다).
 *
 * 2026-09-15 전면 도입: 게이트/신원확인 패널은 @sfood/ui의 Card·Button·Input·ColorTag로,
 * 확인 후의 목록+작성창은 CommentThread로 교체했다. CommentThread는 onReply를 넘길 때만
 * 댓글별 답글 UI를 노출하므로(제공하지 않으면 답글 버튼 자체가 숨겨짐), stage가
 * "composer"일 때만 onReply를 넘기는 것만으로 "신원 확인 전엔 답글도 불가"가 자연히 성립한다.
 */
type Stage = "gate" | "ms-confirm" | "guest-confirm" | "composer";

const RETURN_TO_COOKIE = "ax_return_to";
const PENDING_COMMENT_COOKIE = "ax_pending_comment";
// 쿠키 한 개당 실제 한도(약 4KB)보다 여유 있게 잡는다 — 이름/속성 오버헤드 감안.
const PENDING_COMMENT_COOKIE_MAX_LENGTH = 3500;

function startAxAuthLogin(loginUrl: string) {
  const returnTo = `${window.location.pathname}${window.location.search}`;
  document.cookie = `${RETURN_TO_COOKIE}=${encodeURIComponent(returnTo)}; path=/; max-age=300; SameSite=Lax`;
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

function MsIcon() {
  return (
    <svg viewBox="0 0 23 23" width="15" height="15" aria-hidden="true">
      <rect x="1" y="1" width="10" height="10" fill="#f25022" />
      <rect x="12" y="1" width="10" height="10" fill="#7fba00" />
      <rect x="1" y="12" width="10" height="10" fill="#00a4ef" />
      <rect x="12" y="12" width="10" height="10" fill="#ffb900" />
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
}: CommentSectionProps) {
  const router = useRouter();
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const startAtMsConfirm = isLoggedIn && Boolean(sessionEmail);
  const [stage, setStage] = useState<Stage>(startAtMsConfirm ? "ms-confirm" : "gate");
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [msName, setMsName] = useState(sessionEmail ? sessionEmail.split("@")[0] : "");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestError, setGuestError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);

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

  function backToGate() {
    setIdentity(null);
    setGuestName("");
    setGuestEmail("");
    setGuestError(null);
    setSubmitError(null);
    setStage("gate");
  }

  async function switchIdentity() {
    const wasVerified = identity?.verified ?? false;
    backToGate();
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

  function confirmMsIdentity() {
    if (!sessionEmail) return;
    setIdentity({
      name: msName.trim() || sessionEmail.split("@")[0],
      email: sessionEmail,
      verified: true,
    });
    setStage("composer");
  }

  function confirmGuestIdentity() {
    const name = guestName.trim();
    const email = guestEmail.trim();
    if (!name || !email) {
      setGuestError("이름과 이메일을 모두 입력해주세요");
      return;
    }
    setGuestError(null);
    setIdentity({ name, email, verified: false });
    setStage("composer");
  }

  async function submitCommentDirect(body: string, parentCommentId?: string) {
    if (!identity) return;

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId,
          parentCommentId,
          body,
          authorName: identity.name,
          ...(identity.verified ? {} : { authorEmail: identity.email }),
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

  async function postComment(body: string, parentCommentId?: string) {
    if (!identity) return;
    setSubmitError(null);

    // MS 로그인 사용자는 댓글을 저장할 때마다 AX Auth를 거쳐 신선한 login_token을 받아야
    // 알림 메일을 보낼 수 있다 — 세션이 이미 있으므로 대부분 화면 깜빡임 없이 왕복된다.
    if (identity.verified && loginUrl) {
      const stored = storePendingComment({
        pageId,
        parentCommentId,
        body,
        authorName: identity.name,
      });
      if (stored) {
        startAxAuthLogin(loginUrl);
        return;
      }
    }

    await submitCommentDirect(body, parentCommentId);
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
          <p className="gate-lead">댓글을 남기려면 먼저 작성자를 확인해주세요.</p>
          <div className="gate-options">
            {loginUrl && (
              <Button variant="primary" onClick={() => startAxAuthLogin(loginUrl)}>
                <MsIcon /> MS 계정으로 인증 (사내 직원)
              </Button>
            )}
            <Button variant="secondary" onClick={() => setStage("guest-confirm")}>
              이름으로 계속하기 (외부 방문자)
            </Button>
          </div>
        </Card>
      )}

      {stage === "ms-confirm" && sessionEmail && (
        <Card padding="md" className="identify-panel">
          <div className="panel-label">사내 인증 완료</div>
          <div className="identify-fields">
            <Input
              type="text"
              placeholder="이름"
              value={msName}
              onChange={(event) => setMsName(event.target.value)}
            />
            <ColorTag variant="success">✓ {sessionEmail} 인증됨</ColorTag>
          </div>
          <div className="composer-footer" style={{ borderTop: "none", paddingTop: 0, marginTop: 0 }}>
            <span className="login-hint">이름은 필요하면 고쳐서 등록할 수 있습니다</span>
            <span style={{ display: "flex", gap: 8 }}>
              <Button variant="ghost" size="sm" onClick={backToGate}>
                취소
              </Button>
              <Button variant="primary" size="sm" onClick={confirmMsIdentity}>
                확인하고 댓글 작성
              </Button>
            </span>
          </div>
        </Card>
      )}

      {stage === "guest-confirm" && (
        <Card padding="md" className="identify-panel">
          <div className="panel-label">본인 확인</div>
          <div className="identify-fields">
            <Input
              type="text"
              placeholder="이름"
              value={guestName}
              onChange={(event) => setGuestName(event.target.value)}
            />
            <Input
              type="email"
              placeholder="이메일"
              value={guestEmail}
              onChange={(event) => setGuestEmail(event.target.value)}
              error={Boolean(guestError)}
            />
          </div>
          <div className="composer-footer" style={{ borderTop: "none", paddingTop: 0, marginTop: 0 }}>
            <span className="login-hint" style={guestError ? { color: "var(--brand-red)" } : undefined}>
              {guestError ?? "이름·이메일은 댓글에 그대로 표시됩니다"}
            </span>
            <span style={{ display: "flex", gap: 8 }}>
              <Button variant="ghost" size="sm" onClick={backToGate}>
                취소
              </Button>
              <Button variant="primary" size="sm" onClick={confirmGuestIdentity}>
                확인하고 댓글 작성
              </Button>
            </span>
          </div>
        </Card>
      )}

      {stage === "composer" && identity && (
        <div className="identity-confirmed-bar">
          <span className="who">{identity.name}</span>
          <span className="how">{identity.verified ? "· 사내 인증됨" : "· 외부 방문자"}</span>
          <Button variant="ghost" size="sm" onClick={switchIdentity} disabled={switching}>
            다른 사용자로
          </Button>
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
          showComposer={stage === "composer"}
          composerPlaceholder="댓글을 남겨보세요"
          submitLabel="댓글 등록"
          emptyMessage={loadError ? "댓글 목록을 확인할 수 없습니다." : "아직 댓글이 없습니다."}
          onSubmit={stage === "composer" ? (body: string) => postComment(body) : undefined}
          onReply={
            stage === "composer"
              ? (commentId: string, body: string) => postComment(body, commentId)
              : undefined
          }
        />
      )}
    </section>
  );
}
