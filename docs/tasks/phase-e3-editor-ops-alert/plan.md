# Plan — Phase E3: Editor 이상 감지 → Slack 알림

1. `sendSlackAlert`(이미 존재)를 호출하는 곳이 없음을 확인.
2. 모든 Editor(및 Viewer/Comment) API 라우트가 공통으로 거치는 `src/lib/api-response.ts`의 `toErrorResponse` 502 분기에 배선 — 라우트 파일 각각을 수정하지 않고 한 곳에서 전체 커버.
3. `notifyUpstreamFailure` 헬퍼를 추가해 Slack 전송 실패를 try/catch로 흡수하고 `console.error`로만 기록(원래 API 응답에는 영향 없음).
4. `npm run lint` / `npm run build`로 정적 검증.
5. `.env`의 `SLACK_WEBHOOK_URL` 형식을 정규식으로 먼저 확인한 뒤(값 자체는 출력하지 않음), 사용자 승인을 받아 실제 웹훅에 테스트 메시지 1회 전송해 200 응답 확인.
6. 결과를 `docs/tasks/phase-e3-editor-ops-alert/`에 기록하고 `docs/product/prd.md`의 Phase E3 상태를 갱신.

## 결정 사항

- 서비스별 알림 메시지 접두어("[Editor]" 등)를 붙이지 않기로 했다 — 이 함수는 Editor·Viewer 양쪽 API가 공유하는 저장소 위치에 있어, 특정 서비스로 단정하면 저장소 분리 전까지는 부정확하다.
- rate limit·인증 만료 등 세분화된 이상 감지 로직은 추가하지 않았다 — 현재 코드베이스에 그런 감지 자체가 없고, 요구사항 문서의 예시일 뿐 별도 신설을 요구하는 것은 아니라고 판단했다. 필요해지면 별도 작업으로 진행한다.
- 이전에 SLACK_WEBHOOK_URL 값이 잘못 채워져 있어(Slack 웹훅 URL이 아닌 다른 서비스 토큰으로 추정) 테스트 중 오류 메시지에 값 일부가 노출된 사고가 있었다. 사용자가 값을 재확인·재입력한 뒤, 이번에는 URL 형식을 먼저 정규식으로 검증하고 fetch 실패 시에도 오류 메시지를 그대로 출력하지 않는 방식으로 재시도해 안전하게 확인했다.
