import { sendSlackAlert } from "@/lib/notifications/slack";

const alertedCommentIds = new Set<string>();

/**
 * Confluence 네이티브 댓글 UI로 직접 남긴 댓글은 구조화 형식(`이름 | 이메일 | 댓글`)이 아니라
 * 작성자를 식별할 수 없어 블로그에서 완전히 무시된다(버그가 아니라 architecture.md의 기존
 * 설계 — 댓글은 반드시 블로그 폼을 거쳐야 노출된다). 편집자/운영자가 이 사실을 알아챌 방법이
 * 서버 콘솔 로그뿐이었으므로, 운영 Slack 채널에도 한 번은 알린다.
 *
 * 자체 DB가 없어(architecture.md) 프로세스 메모리 `Set`으로 같은 commentId를 반복 알리지
 * 않는다 — src/lib/rate-limit.ts와 동일한 전제로, 서버리스 인스턴스가 여러 개면 인스턴스별로
 * 독립적으로 동작해 완벽한 중복 제거는 아니다.
 */
export async function notifyIgnoredNativeComment(
  pageId: string,
  commentId: string
): Promise<void> {
  if (alertedCommentIds.has(commentId)) return;
  alertedCommentIds.add(commentId);

  try {
    await sendSlackAlert(
      `Confluence 네이티브 댓글 UI로 직접 남긴 댓글이 블로그에서 무시되었습니다(작성자 식별 불가). pageId: ${pageId}, commentId: ${commentId}. 블로그에 노출하려면 게시글 하단 댓글 폼으로 다시 남겨야 합니다.`
    );
  } catch (error) {
    console.error("[comments] 무시된 네이티브 댓글 Slack 알림 실패", error);
  }
}
