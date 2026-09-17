# tasks — 무시된 Confluence 네이티브 댓글 운영 알림

## 구현

- [x] `src/lib/comments/ignored-comments.ts` 신규: `notifyIgnoredNativeComment` + 메모리 중복 제거
- [x] `src/lib/comments/comments.ts`: `listComments`에 알림 호출 추가
- [x] `src/lib/comments/comments.ts`: `listRecentComments`를 flatMap→for문으로 바꿔 알림 호출 추가

## 검증

- [x] `npm run lint`
- [x] `npm run build`
- [x] 코드 레벨로 중복 제거·양쪽 경로 동일 헬퍼 사용 확인
- [x] `SLACK_WEBHOOK_URL` 없어도 예외 전파 없음 확인
- [x] 실 데이터로 `listComments`/`listRecentComments` 정상 동작 확인(회귀 없음)

## 문서

- [x] `test-result.md` 작성
- [x] `result.md` 작성
