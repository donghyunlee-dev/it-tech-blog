# Result — Phase E3: Editor 이상 감지 → Slack 알림

## 배달된 범위

- Editor(및 현재 저장소 구조상 Viewer/Comment API도 공유하는) API의 분류되지 않은 오류(주로 Confluence 연동 실패)를 감지해 Slack Webhook으로 운영팀에 알리는 배선을 완료했다. 기존에 작성만 되어 있고 호출되지 않던 `sendSlackAlert`를 실제로 연결했다.
- Phase E1/E2에서 검증한 문서 CRUD에 이어, 이미지 등록과 게시 설정(slug 충돌 감지 포함)까지 실 Confluence 인스턴스에 대한 통합 QA를 완료해 Editor 핵심 기능 전체의 실 연동 검증을 마무리했다.

## 변경/생성 파일

- `src/lib/api-response.ts`: `notifyUpstreamFailure` 추가, `toErrorResponse`를 `async`로 변경하고 502(UPSTREAM_ERROR) 분기에서 Slack 알림 호출
- `docs/product/prd.md`: Phase E3 관련 상태 갱신
- `docs/tasks/phase-e3-editor-ops-alert/{spec.md,plan.md,tasks.md,test-result.md,result.md}`(본 문서)

## 핵심 결정

- **라우트 파일 각각이 아니라 공통 `toErrorResponse`에 배선**: Editor의 5개 API 라우트(documents/folder/images/publish 등)와 Viewer/Comment의 API 라우트까지 전부 이 함수를 거치므로, 한 곳만 수정해 전체를 커버했다. 서비스가 아직 한 저장소에 있는 지금 시점에서는 이 방식이 가장 적은 변경으로 가장 넓게 커버하지만, 추후 Editor/Viewer 저장소 분리 시에는 각 저장소에 동일한 로직을 복제해야 한다(prd.md 이관 체크리스트에 이미 있는 항목).
- **Slack 알림 실패는 원래 API 응답에 영향 없음**: `notifyUpstreamFailure`는 try/catch로 감싸 실패해도 `console.error`만 남기고 조용히 넘어간다 — 요구사항의 "Slack Webhook 자체 실패 시 서버 로그에 기록" 예외 처리와 일치한다.
- **알림 메시지에 서비스명을 특정하지 않음**: 공유 위치에 있는 함수라 "[Editor]" 같은 접두어를 붙이면 Viewer 쪽 실패에도 잘못된 라벨이 붙는다. 저장소 분리 이후에는 각 서비스 쪽 코드에서 서비스명을 붙이는 것이 맞다.
- **rate limit·인증 만료 등 세분화된 감지 로직은 신설하지 않음**: 현재 코드베이스에 그런 감지 자체가 없고, prd.md의 예시 나열일 뿐 이번 요청 범위(로그인 연동 + CRUD 검증 이어서 다음 단계 진행)에서 새로 설계할 사안은 아니라고 판단했다.

## 검증 결과

`docs/tasks/phase-e3-editor-ops-alert/test-result.md` 참고. `lint`/`build` 통과, 실 Slack 웹훅에 테스트 메시지 1회 전송해 200 응답 확인(사용자 승인 하에 진행).

**보안 참고**: 이 작업 중 `.env`의 `SLACK_WEBHOOK_URL`에 잘못된 값(Slack 웹훅 URL이 아닌 것으로 보이는 토큰)이 들어있던 상태에서 첫 테스트를 시도해, 오류 메시지에 그 값의 일부가 노출되는 사고가 있었다. 즉시 사용자에게 보고했고, 사용자가 값을 확인·재입력한 뒤 안전한 방식(형식 사전 검증, 오류 메시지 미출력)으로 재시도해 정상 완료했다. 노출되었던 이전 값이 실제 유효한 자격증명이었다면 발급처에서 폐기하는 것을 권장한다는 점을 이미 안내했다.

## 열린 과제(Open Gaps)

- **실 로그인 세션을 통한 브라우저 E2E**: 사용자 판단에 따라 범위에서 제외(백엔드/Confluence 연동 검증으로 충분하다고 판단, Phase E1/E2와 동일한 방침).
- **세분화된 이상 감지**: rate limit 초과, 인증 만료 등을 Confluence 연동 실패와 구분해 감지하는 로직은 없다. 필요해지면 별도 작업으로 설계한다.
- 기존에 열려 있던 과제(Editor/Viewer 저장소 분리, api-spec.md 분리, 댓글 알림 메일 신선한 login_token UX)는 그대로 유지된다.

## Next Steps

- Phase E3(운영 자동화) 자체는 이것으로 마무리한다. 다음은 Viewer 트랙(V1~V4) 재정비, 또는 이관(마이그레이션) 체크리스트 착수 중 하나를 사용자가 선택해 진행한다.
