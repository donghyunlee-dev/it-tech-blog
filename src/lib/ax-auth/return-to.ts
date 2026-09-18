import { NextRequest } from "next/server";

export const RETURN_TO_COOKIE = "ax_return_to";

/** 오픈 리다이렉트 방지 — 우리 서비스 내부의 상대 경로만 허용한다. */
export function resolveReturnTo(request: NextRequest): string {
  const value = request.cookies.get(RETURN_TO_COOKIE)?.value;
  if (value && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return "/";
}

export function appendQuery(path: string, key: string, value: string): string {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${key}=${value}`;
}
