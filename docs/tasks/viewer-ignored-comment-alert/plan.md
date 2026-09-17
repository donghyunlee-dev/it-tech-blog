# plan — 무시된 Confluence 네이티브 댓글 운영 알림

## 접근 방식

기존 `sendSlackAlert`(운영 이상 감지용, `src/lib/notifications/slack.ts`)를 재사용한다. 새 헬퍼 `notifyIgnoredNativeComment(pageId, commentId)`를 추가해 `listComments`/`listRecentComments` 양쪽에서 구조화 형식이 아닌 댓글을 만날 때마다 호출한다. 중복 알림 방지는 `src/lib/rate-limit.ts`와 같은 전제(자체 DB 없음 → 메모리 기반, 프로세스 재시작 시 초기화되는 것은 허용)로 메모리 `Set<commentId>`를 사용한다.

## 영향 범위

- `src/lib/comments/ignored-comments.ts`(신규): `notifyIgnoredNativeComment(pageId, commentId)` — 메모리 `Set`으로 이미 알린 commentId면 즉시 반환, 아니면 `sendSlackAlert` 호출(실패해도 예외를 던지지 않고 로그만 남김).
- `src/lib/comments/comments.ts`:
  - `listComments`: 기존 `console.error` 옆에 `await notifyIgnoredNativeComment(pageId, comment.id)` 추가.
  - `listRecentComments`: 문서별 댓글 조회 부분을 `flatMap`(동기 콜백)에서 `for`문(비동기 콜백 안에서 `await` 가능)으로 바꿔, 건너뛸 때 동일하게 알림을 호출하고 로그도 함께 남긴다(기존에는 로그조차 없었음 — 일관성 확보).

## 검증 전략

1. `npm run lint`, `npm run build`.
2. 코드 레벨로 두 호출 경로가 동일한 헬퍼를 쓰는지, 중복 제거 로직이 같은 commentId에 대해 두 번째 호출부터 조용히 반환하는지 확인.
3. 실 Slack 웹훅을 실제로 울리지는 않는다(운영 채널 노이즈 방지 — phase-v4-integration-qa와 동일한 원칙). 대신 `SLACK_WEBHOOK_URL`이 없을 때도 예외가 상위로 전파되지 않는지 확인.
4. 실 게시 문서(구조화 형식이 아닌 댓글이 실제로 있는 문서가 있다면)로 `listComments`/`listRecentComments` 호출 시 크래시 없이 정상 동작하는지 확인.

## 리스크

- 메모리 기반 중복 제거는 서버리스 인스턴스가 여러 개면 인스턴스별로 독립적으로 동작해 같은 댓글이 인스턴스마다 한 번씩 알림이 갈 수 있다 — "완벽한 차단은 아니다"는 기존 rate-limit 작업과 동일한 트레이드오프로 받아들인다.
- Slack 채널에 pageId/commentId만 남기고 실제 댓글 내용이나 작성자 식별 정보는 포함하지 않는다 — 보안 가이드라인(민감정보 로그 마스킹)을 따르되, 운영자가 Confluence에서 직접 확인할 수 있는 최소한의 식별자만 제공한다.
