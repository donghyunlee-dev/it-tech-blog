# result — 무시된 Confluence 네이티브 댓글 운영 알림

## 요약

viewer-recent-comments의 마지막 열린 과제를 해결했다. Confluence 네이티브 댓글 UI로 직접 남겨 구조화 형식이 아닌 댓글을 발견하면, 기존 콘솔 로그에 더해 운영 Slack 채널에도 알린다. `listComments`(상세 페이지)와 `listRecentComments`(홈 사이드바) 양쪽에서 같은 헬퍼를 쓰도록 통일했다 — 조사해보니 `listRecentComments`는 원래 로그조차 남기지 않는 비일관성이 있었다.

## 변경 파일

- `src/lib/comments/ignored-comments.ts`(신규) — `notifyIgnoredNativeComment(pageId, commentId)`: 메모리 `Set`으로 중복 알림 방지, `sendSlackAlert` 재사용, 실패해도 예외를 던지지 않음
- `src/lib/comments/comments.ts` — `listComments`/`listRecentComments` 양쪽에서 구조화 형식이 아닌 댓글을 만나면 알림 호출(후자는 동기 `flatMap`을 비동기 `for`문으로 바꿔 `await` 가능하게 함)

## 검증

- `npm run lint`/`npm run build` 통과
- `SLACK_WEBHOOK_URL` 미설정 시에도 예외가 상위로 전파되지 않음을 코드 리뷰로 확인
- 실 게시 문서(구조화된 실 댓글 1건 보유)로 상세 페이지·홈 사이드바 모두 기존과 동일하게 정상 노출됨을 확인(회귀 없음)
- 상세는 [test-result.md](test-result.md) 참고

## 열린 과제

- 서버리스 다중 인스턴스 환경에서는 메모리 기반 중복 제거가 인스턴스별로 독립 동작해 같은 댓글이 인스턴스 수만큼 알림 갈 수 있다 — `src/lib/rate-limit.ts`와 동일한 트레이드오프로 받아들인다.
- Editor 저장소에 "무시된 댓글" 목록을 보여주는 화면은 이 저장소 범위 밖이며, 필요하면 별도로 Editor 팀에 전달해야 한다.
