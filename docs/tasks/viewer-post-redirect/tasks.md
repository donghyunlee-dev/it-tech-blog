# tasks — 게시 주소 변경/삭제 시 리다이렉트 처리

## 구현

- [x] `src/lib/viewer/posts.ts`: 상세 조립 로직 `buildPostDetail`로 추출
- [x] `src/lib/viewer/posts.ts`: `extractTrailingUuid`, `resolvePostRoute` 추가
- [x] `src/app/posts/[slug]/page.tsx`: `resolvePostRoute` 사용, `moved` 상태 308 리다이렉트
- [x] `src/app/posts/[slug]/not-found.tsx` 신규 안내 화면
- [x] `docs/product/prd.md` Phase V4 진행 상태 문구 동기화

## 검증

- [x] `npm run lint`
- [x] `npm run build`
- [x] slug 변경 시나리오(실 데이터의 UUID 재사용) 308 리다이렉트 확인
- [x] 완전 미존재/삭제 slug → 안내 화면 확인
- [x] `/api/viewer/posts/{slug}` 회귀 없음 확인

## 문서

- [x] `test-result.md` 작성
- [x] `result.md` 작성
