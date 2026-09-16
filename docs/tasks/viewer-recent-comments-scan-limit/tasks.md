# tasks — 최근 댓글 조회 범위 제한

## 구현

- [x] `src/app/page.tsx`: `RECENT_COMMENTS_SCAN_LIMIT` 상수 추가, `posts.slice(0, N)`을 `listRecentComments`에 전달
- [x] `src/lib/comments/comments.ts`: JSDoc 주석 보강

## 검증

- [x] `npm run lint`
- [x] `npm run build`
- [x] 실 데이터로 홈 사이드바 회귀 없음 확인

## 문서

- [x] `test-result.md` 작성
- [x] `result.md` 작성
