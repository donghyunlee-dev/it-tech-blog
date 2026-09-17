import { NextRequest, NextResponse } from "next/server";
import { signIn } from "@/lib/auth";
import { verifyLoginToken } from "@/lib/ax-auth/client";
import {
  createComment,
  getDocumentNotificationMeta,
} from "@/lib/comments/comments";
import { notifyCommentAdded } from "@/lib/comments/notify";

export const RETURN_TO_COOKIE = "ax_return_to";
export const PENDING_COMMENT_COOKIE = "ax_pending_comment";

interface PendingComment {
  pageId: string;
  parentCommentId?: string;
  body: string;
  authorName: string;
}

/** 오픈 리다이렉트 방지 — 우리 서비스 내부의 상대 경로만 허용한다. */
function resolveReturnTo(request: NextRequest): string {
  const value = request.cookies.get(RETURN_TO_COOKIE)?.value;
  if (value && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return "/";
}

function appendError(path: string, code: string): string {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}error=${code}`;
}

/**
 * `CommentSection`이 댓글 저장 시 심어 둔 초안 쿠키를 읽는다. 손상되었거나 필수 필드가
 * 없으면 무시한다(로그인 트리거 흐름으로 취급 — 아래 GET 핸들러 참고).
 */
function readPendingComment(request: NextRequest): PendingComment | null {
  const raw = request.cookies.get(PENDING_COMMENT_COOKIE)?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (
      typeof parsed?.pageId === "string" &&
      typeof parsed?.body === "string" &&
      typeof parsed?.authorName === "string"
    ) {
      return parsed as PendingComment;
    }
  } catch {
    // 손상된 쿠키 값은 무시하고 아래에서 null을 반환한다.
  }
  return null;
}

/**
 * 이미 로그인되어 있던 사용자가 "댓글 저장"을 눌러 신선한 login_token(메일 발송용)을
 * 받으러 온 경우를 처리한다. 이 요청의 목적은 세션 재생성이 아니므로(호출 시점에 이미
 * 로그인되어 있었음 — CommentSection이 `identity.verified`일 때만 이 흐름을 탄다)
 * NextAuth `signIn()`을 호출하지 않는다. `login_token`의 검증(verify) 예산을 여기서
 * 한 번만 쓰고, 메일 발송(mail-send) 예산은 독립적으로 남아 있으므로 그대로
 * `notifyCommentAdded`에 넘긴다(mail-integration-guide.md — 두 예산은 서로 독립 소비).
 */
async function completePendingComment(
  request: NextRequest,
  loginToken: string,
  pending: PendingComment,
  returnTo: string
): Promise<NextResponse> {
  const verifyResult = await verifyLoginToken(loginToken);

  if (!verifyResult.valid || !verifyResult.email) {
    const response = NextResponse.redirect(
      new URL(appendError(returnTo, "comment_auth_failed"), request.url)
    );
    response.cookies.delete(PENDING_COMMENT_COOKIE);
    return response;
  }

  let redirectPath = returnTo;
  let created: Awaited<ReturnType<typeof createComment>> | null = null;
  try {
    created = await createComment({
      pageId: pending.pageId,
      parentCommentId: pending.parentCommentId,
      body: pending.body,
      session: { email: verifyResult.email },
      authorName: pending.authorName,
    });
  } catch (error) {
    console.error("[ax-callback] 대기 중이던 댓글 생성 실패", error);
    redirectPath = appendError(returnTo, "comment_save_failed");
  }

  // 댓글 생성 자체는 성공했으므로, 이후 알림 메일 실패를 "저장 실패"로 잘못 알리면 사용자가
  // 다시 입력해 중복 댓글을 만들 수 있다 — 조용히 로그만 남기고 리다이렉트 경로는 바꾸지 않는다
  // (notifyCommentAdded 자체가 "실패해도 댓글 작성을 막지 않는다"는 기존 정책과 일관됨).
  if (created) {
    try {
      const documentMeta = await getDocumentNotificationMeta(pending.pageId);
      if (documentMeta) {
        await notifyCommentAdded({
          loginToken,
          commentAuthorName: created.authorName,
          documentTitle: documentMeta.title,
          documentUrl: documentMeta.url,
          documentAuthorEmail: documentMeta.authorEmail,
        });
      }
    } catch (error) {
      console.error(
        "[ax-callback] 댓글 저장 후 알림 메일 발송 실패(댓글은 정상 저장됨)",
        error
      );
    }
  }

  const response = NextResponse.redirect(new URL(redirectPath, request.url));
  response.cookies.delete(PENDING_COMMENT_COOKIE);
  return response;
}

/**
 * AX Auth 리다이렉트 방식 로그인 콜백(api-spec.md의 `GET /api/auth/ax-callback` 참고).
 * 콜백 쿼리 파라미터명이 login-integration-guide.md에 명시되어 있지 않아
 * `login_token`/`loginToken` 두 이름을 모두 확인한다(실제 값 확인 전까지 미검증).
 *
 * 이 라우트는 두 가지 경우를 `ax_pending_comment` 쿠키 유무로 구분한다.
 * - 있으면: 이미 로그인된 사용자가 댓글 저장 시 신선한 메일 발송용 토큰을 받으러 온
 *   것이다(`completePendingComment` 참고) — 세션은 그대로 두고 댓글 생성·메일 발송만 완료.
 * - 없으면: 기존 로그인 트리거(처음 로그인하거나 세션이 만료된 경우) — `signIn()`으로 세션을
 *   생성한다. `signIn()`은 성공(`redirectTo`로 리다이렉트)·실패(`pages.signIn`으로
 *   `?error=...`와 함께 리다이렉트) 양쪽 모두 next/navigation의 redirect()를 던지는 방식으로
 *   동작하므로, 별도의 성공/실패 분기 없이 그 예외를 그대로 전파하면 된다.
 *
 * Viewer는 댓글 작성 시에만 로그인을 트리거하므로, 로그인 시작 전 CommentSection이
 * 심어 둔 `ax_return_to` 쿠키(원래 보던 게시글 경로)로 돌아간다.
 */
export async function GET(request: NextRequest) {
  const loginToken =
    request.nextUrl.searchParams.get("login_token") ??
    request.nextUrl.searchParams.get("loginToken");

  const returnTo = resolveReturnTo(request);

  if (!loginToken) {
    return NextResponse.redirect(
      new URL(appendError(returnTo, "missing_token"), request.url)
    );
  }

  const pendingComment = readPendingComment(request);
  if (pendingComment) {
    return completePendingComment(request, loginToken, pendingComment, returnTo);
  }

  await signIn("ax-auth", { loginToken, redirectTo: returnTo });
}
