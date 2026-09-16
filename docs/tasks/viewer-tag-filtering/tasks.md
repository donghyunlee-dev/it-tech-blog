# tasks — 태그 기반 필터링/검색

## 구현

- [x] `src/app/api/viewer/posts/route.ts`: 응답에 `tags` 추가
- [x] `docs/product/api-spec.md`: `tags` 필드 문서화
- [x] `src/app/tags/[tag]/page.tsx` 신규: 태그별 게시글 아카이브
- [x] `src/components/layout/SearchOverlay.tsx`: "태그" `CommandGroup` 추가
- [x] `src/app/posts/[slug]/page.tsx`: 태그 링크화
- [x] `src/app/globals.css`: `.kicker a` 색상 보정

## 검증

- [x] `npm run lint`
- [x] `npm run build`
- [x] `GET /api/viewer/posts` 응답에 `tags` 포함 확인
- [x] `/tags/{태그}` 실 데이터 필터링 확인(대소문자 무관 포함)
- [x] 존재하지 않는 태그 → 빈 상태 안내 확인
- [x] 브라우저로 검색창 태그 그룹/필터링/이동 확인
- [x] 상세 페이지 태그 클릭 이동 확인

## 문서

- [x] `test-result.md` 작성
- [x] `result.md` 작성
