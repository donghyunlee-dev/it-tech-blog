# result — 최근 댓글 조회 범위 제한

## 요약

viewer-recent-comments의 열린 과제였던 "게시 문서 수가 늘어나면 홈 로드 시 댓글 조회 API 호출이 늘어난다"를 해결했다. 홈 화면이 `listRecentComments`에 넘기는 게시 문서를 최신순 상위 10건으로 제한해, 게시 문서 총수와 무관하게 댓글 조회 호출 수의 상한을 고정했다.

## 변경 파일

- `src/app/page.tsx` — `RECENT_COMMENTS_SCAN_LIMIT = 10` 추가, `listRecentComments` 호출 시 `posts.slice(0, RECENT_COMMENTS_SCAN_LIMIT)` 전달
- `src/lib/comments/comments.ts` — `listRecentComments`의 JSDoc에 호출부가 스캔 범위를 제한해 넘겨야 한다는 전제 보강

## 검증

- `npm run lint`/`npm run build` 통과
- 실 데이터(게시 문서 3건, 스캔 범위 10보다 적음)로 홈 사이드바가 기존과 동일하게 노출됨을 확인(회귀 없음)
- 상세는 [test-result.md](test-result.md) 참고

## 열린 과제

- 스캔 범위(10) 안에 댓글 있는 문서가 하나도 없는 극단적 경우(오래된 문서에만 댓글이 몰린 경우), 사이드바가 실제로는 댓글이 있는데도 비어 보일 수 있다 — spec.md에서 이미 감수하기로 한 트레이드오프.
- 게시 문서가 실제로 10건을 넘는 상황은 아직 실 데이터로 재현해 본 적이 없다 — 향후 문서 수가 늘어나면 스캔 범위 값(10)을 재검토할 수 있다.
