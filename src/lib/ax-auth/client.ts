import { requireEnv } from "@/lib/env";

interface AxAuthVerifyResult {
  valid: boolean;
  email?: string;
  reason?: string;
}

function getBaseUrl(): string {
  return process.env.AX_AUTH_BASE_URL || "https://ax-auth.s-food.ai";
}

/**
 * AX Auth 로그인 시작 URL. login-integration-guide.md의 `GET /auth/login/{clientId}`를 사용한다.
 */
export function getAxAuthLoginUrl(): string {
  const clientId = requireEnv("AX_AUTH_CLIENT_ID");
  const redirectUri = requireEnv("AX_AUTH_REDIRECT_URI");
  const url = new URL(`/auth/login/${clientId}`, getBaseUrl());
  url.searchParams.set("redirect_uri", redirectUri);
  return url.toString();
}

/**
 * login-integration-guide.md의 리다이렉트 방식 서버 검증(`POST /auth/token/verify`).
 * 응답 스키마(`valid`/`email`/`reason`)는 팝업 릴레이 방식(verifyViaRelay)의 응답 형태에
 * 근거한 추정이며, AX팀의 전체 연동 가이드로 확인되기 전까지는 미검증 상태다.
 */
export async function verifyLoginToken(
  loginToken: string
): Promise<AxAuthVerifyResult> {
  const clientId = requireEnv("AX_AUTH_CLIENT_ID");
  const clientSecret = requireEnv("AX_AUTH_CLIENT_SECRET");

  try {
    const response = await fetch(new URL("/auth/token/verify", getBaseUrl()), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, clientSecret, loginToken }),
    });

    const data = (await response.json()) as AxAuthVerifyResult;
    return data;
  } catch {
    return { valid: false, reason: "AX_AUTH_REQUEST_FAILED" };
  }
}
