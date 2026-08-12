import { NextResponse } from "next/server";
import { UnauthorizedError } from "@/lib/auth-guard";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/editor/errors";

function errorBody(code: string, message: string) {
  return { error: { code, message } };
}

/**
 * 도메인 계층에서 던진 오류를 api-spec.md의 공통 에러 형식 응답으로 변환한다.
 * 분류되지 않은 오류(Confluence 연동 실패 등)는 502로 취급한다.
 */
export function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json(errorBody("UNAUTHORIZED", error.message), {
      status: 401,
    });
  }
  if (error instanceof ValidationError) {
    return NextResponse.json(errorBody("INVALID_REQUEST", error.message), {
      status: 400,
    });
  }
  if (error instanceof NotFoundError) {
    return NextResponse.json(errorBody("NOT_FOUND", error.message), {
      status: 404,
    });
  }
  if (error instanceof ConflictError) {
    return NextResponse.json(errorBody("CONFLICT", error.message), {
      status: 409,
    });
  }

  const message = error instanceof Error ? error.message : "알 수 없는 오류";
  return NextResponse.json(errorBody("UPSTREAM_ERROR", message), {
    status: 502,
  });
}
