import { sendMail } from "@/lib/ax-auth/client";

export interface NotifyCommentInput {
  /** 댓글 작성 시점의 신선한 AX Auth login_token. 없으면 발송을 시도하지 않는다. */
  loginToken?: string;
  commentAuthorName: string;
  documentTitle: string;
  documentUrl: string;
  documentAuthorEmail: string | null;
}

/**
 * 댓글 알림 메일(mail-integration-guide.md)을 발송한다. 절대 예외를 던지지 않는다 —
 * 실패해도 댓글 작성 자체는 이미 완료된 뒤이므로 로그만 남긴다(prd.md 예외 상황 참고).
 *
 * 알려진 제약: login_token은 발급 후 180초·1회성이라, 댓글 작성 시점에 항상 신선한 값을
 * 확보할 수 있는 UX(예: 제출 직전 AX Auth 팝업 재인증)는 아직 없다. loginToken이 없으면
 * 조용히 건너뛴다 — docs/tasks/phase-4/spec.md의 "범위 제외" 참고.
 */
export async function notifyCommentAdded(input: NotifyCommentInput): Promise<void> {
  if (!input.loginToken || !input.documentAuthorEmail) {
    return;
  }

  try {
    const result = await sendMail({
      loginToken: input.loginToken,
      recipients: [input.documentAuthorEmail],
      subject: `[SFOOD IT Tech Blog] "${input.documentTitle}"에 새 댓글이 달렸습니다`,
      body: `${input.commentAuthorName}님이 댓글을 남겼습니다.\n\n${input.documentUrl}`,
    });

    if (!result.success) {
      console.error(`[comment-notify] 메일 발송 실패: ${result.reason}`);
    }
  } catch (error) {
    console.error("[comment-notify] 메일 발송 중 오류", error);
  }
}
