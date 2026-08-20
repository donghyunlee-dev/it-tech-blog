# Tasks — Phase E3: Editor 이상 감지 → Slack 알림

## 구현 작업

- [x] `src/lib/api-response.ts`에 `notifyUpstreamFailure` 추가, `toErrorResponse`의 502 분기에서 호출
- [x] `toErrorResponse`를 `async`로 변경(호출부 전부 이미 async 함수 내 `return`이라 별도 수정 불필요 확인)

## 테스트 작업

- [x] `npm run lint` 실행
- [x] `npm run build` 실행
- [x] `SLACK_WEBHOOK_URL` 형식을 정규식으로 사전 검증(값 자체는 출력하지 않음)
- [x] 사용자 승인 하에 실 웹훅으로 테스트 메시지 1회 전송, 200 응답 확인
- [x] 통합 QA: 이미지 등록(첨부파일 업로드 + `<ac:image>` 매크로 변환) 실 Confluence 검증
- [x] 통합 QA: 게시 설정 저장·재조회, slug 충돌 감지 실 Confluence 검증
- [x] 테스트로 생성한 Confluence 페이지 정리(삭제)

## 문서화 작업

- [x] `docs/product/prd.md` Phase E3 상태 갱신
- [x] `docs/tasks/phase-e3-editor-ops-alert/{spec.md,plan.md,tasks.md,test-result.md,result.md}` 작성

## 진행 상태

Slack 알림 배선·실 전송 검증, 그리고 이미지 등록·게시 설정(slug 충돌 포함) 통합 QA까지 완료. 실 로그인 세션을 통한 브라우저 UI 클릭 테스트는 사용자 판단에 따라 범위에서 제외.
