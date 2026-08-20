import { NextRequest, NextResponse } from "next/server";
import { signIn } from "@/lib/auth";

export const RETURN_TO_COOKIE = "ax_return_to";

/** 오픈 리다이렉트 방지 — 우리 서비스 내부의 상대 경로만 허용한다. */
function resolveReturnTo(request: NextRequest): string {
  const value = request.cookies.get(RETURN_TO_COOKIE)?.value;
  if (value && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return "/";
}

/**
 * AX Auth 리다이렉트 방식 로그인 콜백(api-spec.md의 `GET /api/auth/ax-callback` 참고).
 * 콜백 쿼리 파라미터명이 login-integration-guide.md에 명시되어 있지 않아
 * `login_token`/`loginToken` 두 이름을 모두 확인한다(실제 값 확인 전까지 미검증).
 *
 * Viewer는 댓글 작성 시에만 로그인을 트리거하므로, 로그인 시작 전 CommentSection이
 * 심어 둔 `ax_return_to` 쿠키(원래 보던 게시글 경로)로 돌아간다.
 *
 * signIn()은 성공(`redirectTo`로 리다이렉트)·실패(`pages.signIn`으로 `?error=...`와 함께
 * 리다이렉트) 양쪽 모두 next/navigation의 redirect()를 던지는 방식으로 동작하므로,
 * 이 라우트는 별도의 성공/실패 분기 없이 그 예외를 그대로 전파하면 된다.
 */
export async function GET(request: NextRequest) {
  const loginToken =
    request.nextUrl.searchParams.get("login_token") ??
    request.nextUrl.searchParams.get("loginToken");

  const returnTo = resolveReturnTo(request);

  if (!loginToken) {
    const separator = returnTo.includes("?") ? "&" : "?";
    return NextResponse.redirect(
      new URL(`${returnTo}${separator}error=missing_token`, request.url)
    );
  }

  await signIn("ax-auth", { loginToken, redirectTo: returnTo });
}
