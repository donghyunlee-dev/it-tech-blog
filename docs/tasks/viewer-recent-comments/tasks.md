# tasks — 사이드바 "최근 댓글" 실데이터

## 구현

- [x] `comments.ts`에 `listRecentComments(posts, limit)` 추가(게시 문서별 병렬 조회, 평면 정렬, 상위 N개)
- [x] `page.tsx`에서 호출해 `RecentCommentsSidebar`에 실제 데이터 전달

## 검증

- [x] `npm run lint`
- [x] `npm run build`
- [x] 실 게시 문서(댓글 0건)로 사이드바 미노출(정상) 및 콘솔 에러 없음 확인
- [ ] 실제 댓글이 있을 때 사이드바 노출 — 운영 Confluence에 임의로 댓글을 남기지 않기로 해 미검증(아래 result.md 참고)

## 문서

- [x] `test-result.md` 작성
- [x] `result.md` 작성
