import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { toErrorResponse } from "@/lib/api-response";
import { ValidationError } from "@/lib/errors";
import {
  createComment,
  getDocumentNotificationMeta,
  listComments,
} from "@/lib/comments/comments";
import { notifyCommentAdded } from "@/lib/comments/notify";
import { assertWithinRateLimit } from "@/lib/rate-limit";

// 외부 사용자(비로그인) 댓글 작성만 제한한다 — api-spec.md의 POST /api/comments 429 계약과
// 동일한 범위. MS 로그인 사용자는 세션으로 이미 신원이 식별되어 스팸 위험이 낮다.
const EXTERNAL_COMMENT_RATE_LIMIT = { limit: 5, windowMs: 60_000 };

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function GET(request: NextRequest) {
  try {
    const pageId = request.nextUrl.searchParams.get("pageId");
    if (!pageId) {
      throw new ValidationError("pageId는 필수입니다.");
    }

    const comments = await listComments(pageId);
    return NextResponse.json({ comments });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const sessionEmail = session?.user?.email;

    if (!sessionEmail) {
      assertWithinRateLimit(
        `comment:${getClientIp(request)}`,
        EXTERNAL_COMMENT_RATE_LIMIT
      );
    }

    const payload = (await request.json()) as {
      pageId?: string;
      parentCommentId?: string;
      body?: string;
      authorName?: string;
      authorEmail?: string;
      loginToken?: string;
    };

    if (!payload.pageId) {
      throw new ValidationError("pageId는 필수입니다.");
    }

    const result = await createComment({
      pageId: payload.pageId,
      parentCommentId: payload.parentCommentId,
      body: payload.body ?? "",
      session: sessionEmail ? { email: sessionEmail } : null,
      authorName: payload.authorName,
      authorEmail: payload.authorEmail,
    });

    if (result.authorType === "ms_user") {
      const documentMeta = await getDocumentNotificationMeta(payload.pageId);
      if (documentMeta) {
        await notifyCommentAdded({
          loginToken: payload.loginToken,
          commentAuthorName: result.authorName,
          documentTitle: documentMeta.title,
          documentUrl: documentMeta.url,
          documentAuthorEmail: documentMeta.authorEmail,
        });
      }
    }

    return NextResponse.json(
      { commentId: result.commentId, createdAt: result.createdAt },
      { status: 201 }
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
