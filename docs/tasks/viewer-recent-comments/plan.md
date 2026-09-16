# plan — 사이드바 "최근 댓글" 실데이터

## 접근 방식

`listPublishedPosts()`로 게시 문서 목록(pageId·slug·title)을 얻고, 각 문서의 댓글을 `listFooterComments(pageId)`로 병렬 조회한다. 계층 구성 없이 평면적으로 파싱해 `createdAt` 기준 내림차순 정렬 후 상위 N개만 반환한다.

## 영향 범위

- `src/lib/comments/comments.ts`: `listRecentComments(limit: number): Promise<RecentComment[]>` 추가.
  - `RecentComment { commentId, authorName, quote, createdAt, postSlug, postTitle }`.
  - 댓글 본문은 공백 정규화 후 60자로 자르고 초과 시 `…` 부착(`truncateQuote`).
  - 문서별 조회는 `Promise.allSettled`가 아니라 개별 try/catch로 감싸 실패한 문서만 빈 배열로 처리하고 나머지는 정상 반환(부분 실패 허용).
- `src/app/page.tsx`: `listPublishedPosts()`와 `listRecentComments(4)`를 병렬로 호출(`Promise.all`), 실패 시 빈 배열로 폴백. `RecentCommentsSidebar`에 `{commentId, quote, authorName, postSlug, postTitle}`로 매핑해 전달.

## 검증 전략

1. `npm run lint`, `npm run build`.
2. 실 게시 문서에 댓글이 없는 현재 상태에서 사이드바가 렌더링되지 않는지 확인(정상 — 빈 배열 처리 검증).
3. 가능하면 실제로 댓글을 하나 등록해보고 사이드바에 즉시(다음 새로고침 시) 나타나는지 확인.

## 리스크

- 게시 문서 수가 늘어나면 이 조회가 게시 문서 수만큼 API 호출을 추가로 발생시킨다 — 현재 규모(3건)에서는 무시할 수준이나, "소규모 팀" 전제가 깨지면(data-spec.md 언급된 대로) 재검토가 필요하다.
