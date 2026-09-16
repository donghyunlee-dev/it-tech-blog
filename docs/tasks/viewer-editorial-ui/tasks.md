# tasks — Viewer 에디토리얼 매거진 UI 적용

## 구현

- [x] `design-system-adoption.md`에 2026-09-15 MCP 재확인 결과 추가
- [x] `globals.css` 토큰/유틸리티 클래스 확장
- [x] `publish-metadata.ts`에 optional `category`/`series` 필드 추가
- [x] `posts.ts`: `metaDescription`/`category`/`readingMinutes`/`heroImageUrl` 노출, `estimateReadingMinutes`/`extractFirstImageSrc` 유틸 추가
- [x] `api/viewer/posts/route.ts`: `metaDescription` 응답에 포함
- [x] `comments.ts`: 세션 사용자도 `authorName` 편집 허용하도록 `createComment` 수정
- [x] `SiteHeader`(홈/상세 variant), `SearchOverlay`, `SiteFooter` 컴포넌트 작성
- [x] `PostCard`, `Hero`, `RecentCommentsSidebar`, `SeriesWidget` 컴포넌트 작성
- [x] `src/app/page.tsx` 재조립
- [x] `src/app/posts/[slug]/page.tsx` 재조립
- [x] `CommentSection.tsx` 3단계 상태 머신으로 재작성

## 검증

- [x] `npm run lint`
- [x] `npm run build`
- [x] 로컬 프리뷰로 홈/검색 확인(상세·댓글 흐름은 게시된 문서가 없어 실데이터로 미확인 — test-result.md 참고)
- [x] AI 슬롭 체크리스트 재점검

## 문서

- [x] `test-result.md` 작성
- [x] `result.md` 작성

## 추가 구현 (2026-09-15, `@sfood/ui@0.1.3` 전면 도입)

- [x] `npm view`/`unpkg`로 `@sfood/ui@0.1.3` 수정 내역 정적 재확인(설치 전)
- [x] React 19.2.8 → 18.3.1 다운그레이드, `@types/react`/`@types/react-dom` 동기화
- [x] `@sfood/ui@0.1.3`(exact) 설치, Tailwind v3 + PostCSS 도입(`tailwind.config.mjs`/`postcss.config.mjs` 신규)
- [x] 격리 라우트(`/design-preview`)에서 `Button`/`ColorTag`/`Highlight`/`MultiSelect`/`CommentThread` 실제 렌더링 검증(빌드+브라우저) 후 라우트 삭제
- [x] `globals.css`: `@sfood/ui` 토큰 import, `@tailwind` 지시어 추가, 브랜드 컬러·폰트를 공식 토큰 참조로 교체, 이제 컴포넌트가 대신하는 CSS(게이트 옵션 버튼·입력창·댓글 아이템 등) 제거
- [x] `layout.tsx`에 `data-theme="light"` 추가(다크모드 오염 방지 — 실제로 발견한 버그 수정)
- [x] `CommentSection.tsx`를 `Card`/`Button`/`Input`/`ColorTag`/`CommentThread`로 재작성
- [x] `SearchOverlay.tsx`를 `CommandPalette`로 재작성, `SiteHeader.tsx`에 Cmd/Ctrl+K 단축키 추가
- [x] 격리 라우트에서 댓글 게이트→확인→작성 전체 흐름 클릭 검증(가짜 pageId로 인한 정상 실패까지 확인), 발견된 버그(목록 조회 실패 시 작성창까지 숨겨지던 문제) 수정
- [x] `npm run lint`/`npm run build` 재통과 확인
- [x] `docs/guide/design-system.md`, `design-system-adoption.md`, `design-direction.md`에 전면 도입 결과 반영
- [x] `spec.md`/`plan.md`/`test-result.md`/`result.md`에 추가 확인·결정·검증 내역 기록
