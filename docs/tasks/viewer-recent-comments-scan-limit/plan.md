# plan — 최근 댓글 조회 범위 제한

## 접근 방식

`listRecentComments`(comments.ts)의 시그니처나 내부 로직은 바꾸지 않는다 — 이미 "받은 목록 전체를 병렬 조회"하는 함수이므로, 호출부(`src/app/page.tsx`)가 넘기는 `posts` 배열 자체를 최신순 상위 N건으로 잘라서 넘기는 것으로 충분하다. `listPublishedPosts()`가 이미 `publishedAt` 내림차순으로 정렬해 반환하므로 단순 `slice(0, N)`이면 된다.

## 영향 범위

- `src/app/page.tsx`: `RECENT_COMMENTS_SCAN_LIMIT` 상수 추가(사이드바 표시 개수 `RECENT_COMMENTS_LIMIT`보다 넉넉한 값), `listRecentComments(posts, ...)` 호출을 `listRecentComments(posts.slice(0, RECENT_COMMENTS_SCAN_LIMIT), ...)`로 변경.
- `src/lib/comments/comments.ts`: `listRecentComments`의 JSDoc 주석에 "호출부가 이미 스캔 범위를 제한해 넘긴다"는 전제를 한 줄 보강(함수 자체 동작은 변경 없음).

## 스캔 범위 값

`RECENT_COMMENTS_SCAN_LIMIT = 10`으로 정한다. 사이드바에는 4개만 보이지만, 가장 최근 게시물 여러 개가 우연히 댓글이 없을 수 있어 표시 개수의 2배 이상 여유를 둔다. 문서/요구사항에 구체적 수치가 없어 임의로 정한 값이며, 실사용 데이터가 쌓이면 조정 가능하도록 상수로 분리해 둔다.

## 검증 전략

1. `npm run lint`, `npm run build`.
2. 실 데이터(현재 3건, 스캔 범위 10보다 적음)로 홈 화면 사이드바가 기존과 동일하게 노출되는지 확인(회귀 없음 — 3건 모두 스캔 범위 안에 들어가므로 동작 차이가 없어야 한다).
3. 코드 레벨 검토로, 게시 문서가 스캔 범위보다 많아질 경우 `listRecentComments`에 넘어가는 배열 길이가 상한을 넘지 않음을 확인(현재 실 데이터로는 이 경우를 재현할 수 없음 — 실 게시물이 3건뿐이라 10건 이상으로 늘려 테스트할 수 없다).

## 리스크

- 스캔 범위(10) 안에 댓글 있는 문서가 하나도 없으면(모두 범위 밖의 오래된 문서에만 댓글이 있는 극단적 경우), 사이드바가 실제로는 댓글이 있는데도 비어 보일 수 있다 — spec.md에서 이미 감수하기로 한 트레이드오프(전체 스캔의 확장성 문제보다 낫다고 판단).
