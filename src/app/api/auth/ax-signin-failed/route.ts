import { NextRequest, NextResponse } from "next/server";
import { appendQuery, resolveReturnTo } from "@/lib/ax-auth/return-to";

/**
 * `auth.ts`의 `pages.signIn` 대상. AX Auth 로그인이 실패하면(만료된 login_token, 인증 거부,
 * 사내 계정이 아님 등) NextAuth가 여기로 `?error=CredentialsSignin`과 함께 리다이렉트한다.
 *
 * 이걸 오류 화면으로 보여주는 대신, 원래 보던 글로 돌아가 이름/이메일을 직접 입력하는 댓글
 * 작성 화면으로 자연스럽게 넘어가도록 한다(요청: "로그인이 실패하거나 사내 계정이 아니라서
 * 인증을 못받으면 오류로 처리하는 게 아니라 일반 댓글로 판단"). `ax_return_to` 쿠키는
 * `CommentSection`의 로그인 버튼이 리다이렉트 직전에 심어 둔 값을 그대로 재사용한다.
 */
export function GET(request: NextRequest) {
  const returnTo = resolveReturnTo(request);
  return NextResponse.redirect(new URL(appendQuery(returnTo, "comment", "guest"), request.url));
}
