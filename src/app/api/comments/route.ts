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
