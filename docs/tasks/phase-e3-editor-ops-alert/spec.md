# Spec — Phase E3: Editor 이상 감지 → Slack 알림

## 목표

Editor의 Confluence API 호출 실패(게시 실패, 인증 만료, rate limit 초과 등 분류되지 않은 오류)를 감지해 Slack Webhook으로 운영팀에 알린다.

## 배경

- `src/lib/notifications/slack.ts`의 `sendSlackAlert`는 이전 세션에서 이미 작성되어 있었지만, 실제로 호출하는 곳이 코드베이스 어디에도 없었다("미연결" 상태로 prd.md 이관 체크리스트에 기록되어 있었음).
- Editor의 모든 API 라우트(`documents`, `documents/{pageId}`, `documents/{pageId}/images`, `documents/{pageId}/publish`, `folder`)는 이미 공통 `toErrorResponse`(`src/lib/api-response.ts`)로 오류 응답을 만들고 있었고, 그 안에는 분류되지 않은 오류(주로 `ConfluenceApiError`)를 502로 응답하는 catch-all 분기가 있었다. 이 지점이 "Confluence 연동 실패 감지"의 자연스러운 단일 연결점이다.
- 이 함수는 Viewer/Comment API(`/api/comments`, `/api/viewer/posts*`)에서도 공통으로 쓰이므로, 여기 배선하면 Viewer의 "이상 감지 → Slack 알림(Viewer, Phase V4)" 요구사항의 Confluence 연동 실패 부분도 함께 충족된다(서비스가 아직 분리되지 않은 현재 저장소 구조이기 때문에 가능한 이점이며, 추후 저장소 분리 시에는 각 서비스에 동일한 배선을 복제해야 한다).

## 범위

- 포함: `toErrorResponse`의 502(UPSTREAM_ERROR) 분기에서 `sendSlackAlert` 호출. Slack 전송 자체가 실패해도 API 응답에는 영향 없이 서버 로그에만 기록.
- 제외: rate limit 감지·인증 만료 감지 등 502로 분류되지 않는 별도 이상 징후 감지(요구사항에 명시된 예시일 뿐, 현재 코드에 별도의 rate limit/인증 만료 감지 로직 자체가 없음 — 감지 로직 신설은 이번 범위 밖). "통합 QA"는 이 작업에 포함하지 않음(별도 후속 작업으로 판단).

## 완료 기준

- `npm run lint`, `npm run build` 통과.
- 실제 Slack Incoming Webhook에 테스트 메시지를 1회 전송해 200 응답을 확인(사용자 승인 하에 진행).
- Slack Webhook 자체 실패 시에도 API 응답(4xx/5xx 등 원래 응답)이 정상적으로 반환되는지 코드 경로상 확인(try/catch로 흡수).

## 미확인 사항

- Rate limit·인증 만료 등 502 이외의 이상 징후를 별도로 분류해 감지하는 로직은 없다. 현재는 "Confluence API가 예기치 못한 오류를 반환한 경우 전부"를 502로 묶어 알림을 보내는 수준이다. 세분화가 필요하면 별도 작업으로 진행한다.
