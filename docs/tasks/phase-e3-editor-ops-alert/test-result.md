# Test Result — Phase E3: Editor 이상 감지 → Slack 알림 + 통합 QA

## 정적 검증

- `npm run lint`: 통과.
- `npm run build`: 통과. `toErrorResponse`를 async로 변경한 뒤에도 기존 9개 호출부(전부 async 라우트 핸들러 내부의 `return toErrorResponse(error)`) 타입 오류 없음.

## SLACK_WEBHOOK_URL 값 사고 및 재확인

- 최초 테스트 시 `.env`의 `SLACK_WEBHOOK_URL`이 Slack 웹훅 URL 형식이 아닌 것으로 보이는 값(`sbp_`로 시작하는 토큰 형태)이었고, `fetch()`가 URL 파싱에 실패하며 그 오류 메시지에 값의 일부가 노출되는 사고가 있었다. 사용자에게 즉시 보고했고, 사용자가 값을 확인 후 재입력했다.
- 재입력 후에는 값을 출력하지 않고 정규식(`^https:\/\/hooks\.slack\.com\/services\/...`)으로만 형식을 확인했다 → 일치함을 확인.
- 이번에는 `fetch()` 실패 시에도 오류 메시지를 그대로 출력하지 않도록 스크립트를 수정한 뒤 재시도했다.

## 실 Slack 웹훅 전송 테스트 (사용자 승인 하에 진행)

- 요청: `POST {SLACK_WEBHOOK_URL}`, body `{"text": "Confluence 연동 실패: [테스트] Editor 이상 감지 Slack 알림 연동 확인용 메시지입니다."}`
- 응답: `200 OK`
- 결과: 실제 Slack 채널에 테스트 메시지가 정상 도달함을 확인.

## 코드 경로 확인 (정적 검토)

- `toErrorResponse`의 앞쪽 4개 분기(`UnauthorizedError`/`ValidationError`/`NotFoundError`/`ConflictError`)는 Slack 알림을 트리거하지 않는다 — 이들은 클라이언트 입력/인증 문제이지 "Confluence 연동 실패"가 아니기 때문에 요구사항과 일치한다.
- 마지막 catch-all(502, 주로 `ConfluenceApiError`나 예기치 못한 오류)에서만 `notifyUpstreamFailure` 호출 → `sendSlackAlert` 시도 → 실패해도 `catch`로 흡수하고 `console.error`만 남기며, 원래 502 응답은 그대로 반환된다.

## 통합 QA — Editor 핵심 기능 실 Confluence 연동 확장 검증

Phase E1/E2 작업(`docs/tasks/phase-e1-e2-editor-login-crud/`)에서 이미 검증한 문서 생성·조회·수정·버전충돌감지·삭제·목록제외에 더해, 이번에는 **이미지 등록**과 **게시 설정(slug 충돌 감지 포함)**을 앱 코드(`src/lib/editor/markdown.ts`의 실제 `marked` 렌더러 오버라이드, `src/lib/editor/publish.ts`/`folder.ts`의 로직)와 동일한 방식으로 실 Confluence 인스턴스에 대해 검증했다. 테스트로 만든 데이터는 모두 정리했다.

| 항목 | 결과 |
|---|---|
| 1. 문서 생성(이미지 참조 포함 Markdown) | 성공 |
| 2. 이미지 첨부파일 업로드(`POST /rest/api/content/{id}/child/attachment`, 1x1 PNG) | 성공 |
| 3. 저장된 본문에 `<ac:image><ri:attachment ri:filename="test.png" /></ac:image>` 매크로로 정확히 변환되어 있는지 확인 | 확인됨 — `src/lib/editor/markdown.ts`의 `confluence-attachment://` 스킴 치환 로직이 실제로 올바른 Confluence 매크로를 생성함 |
| 4. 게시 설정 저장(`publishMetadata` content property: isPublished/slug/metaDescription) | 성공 |
| 5. 게시 설정 재조회 | 저장한 값과 정확히 일치 |
| 6. slug 충돌 감지(동일 slug를 쓰는 기존 문서가 있을 때 이를 찾아내는지, `findPublishedPageBySlug`와 동일한 방식으로 공간 전체를 순회) | 기존 문서를 정확히 찾아냄(충돌 감지 로직이 실제로 동작함을 확인) |
| 7. 테스트 문서 2건 정리(삭제) | 성공 |

**결과: Editor의 핵심 기능(로그인 연동, 문서 CRUD, 이미지 등록, 게시 설정·slug 충돌 감지, Slack 이상 알림) 전체가 실 Confluence/AX Auth 환경에 대해 정상 동작함을 확인했다.**

## 미검증 항목

- 실 로그인 세션을 통한 브라우저 UI 클릭 테스트(작성/수정/삭제/이미지 업로드/게시 버튼)는 사용자가 백엔드 검증으로 충분하다고 판단해 진행하지 않았다(Phase E1/E2 result.md 참고, 동일 방침 유지).
- 실제 Editor API 라우트가 인증된 세션에서 진짜 Confluence 오류를 만나 502를 반환하고 Slack 알림까지 자동 트리거되는 전체 HTTP 경로 E2E는 위와 같은 이유로 확인하지 못했다. 대신 Slack 웹훅 자체 도달과 502 분기 코드 경로를 각각 별도로 확인했다.
