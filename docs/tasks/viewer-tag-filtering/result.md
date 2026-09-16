# result — 태그 기반 필터링/검색

## 요약

viewer-tag-labels에서 범위 제외했던 "태그 기반 필터링/검색"을 구현했다. `@sfood/ui`의 `CommandPalette`가 커스텀 pill row UI를 지원하지 않아, 검색 오버레이에 "태그" 그룹(태그명+건수)을 추가하고 선택 시 새로 만든 태그 아카이브 페이지(`/tags/[tag]`)로 이동하는 방식으로 구현했다. 상세 페이지의 태그도 이 아카이브 페이지로 연결되는 링크로 바꿨다.

## 변경 파일

- `src/app/api/viewer/posts/route.ts` — 응답에 `tags` 추가
- `docs/product/api-spec.md` — `GET /api/viewer/posts` 응답 스키마에 `tags` 문서화
- `src/app/tags/[tag]/page.tsx`(신규) — 태그별 게시글 아카이브(홈과 동일한 `PostCard` 그리드, 대소문자 무관 매칭, 빈 상태 안내)
- `src/components/layout/SearchOverlay.tsx` — "태그" `CommandGroup` 추가(건수 집계, 태그 없으면 그룹 생략), placeholder 문구 갱신
- `src/app/posts/[slug]/page.tsx` — 키커의 각 태그를 `/tags/{tag}` 링크로 변경
- `src/app/globals.css` — `.kicker a`가 브랜드 레드 색상을 유지하도록 전역 링크 색상 리셋을 덮어씀

## 검증

- `npm run lint`/`npm run build` 통과
- 실 데이터로 `/api/viewer/posts`의 `tags` 노출, `/tags/{tag}` 필터링(대소문자 무관), 빈 태그 안내를 curl로 확인
- 브라우저로 검색 오버레이의 "태그" 그룹 렌더링, 태그명 텍스트 필터링, 태그 선택 시 이동, 상세 페이지 태그 클릭 이동, 브랜드 레드 스타일 유지까지 확인
- 상세는 [test-result.md](test-result.md) 참고

## 열린 과제

- 홈 화면 카드/히어로의 키커는 카드 전체가 이미 게시글 링크라 클릭 가능하게 만들지 않았다 — 필요하면 카드를 클라이언트 컴포넌트로 바꿔 `stopPropagation` 처리하는 별도 작업이 필요하다.
- 태그 아카이브 페이지는 이번 범위에서 `sitemap.xml`에 포함하지 않았다 — 검색엔진 노출이 필요해지면 별도 검토.
- 여러 태그 동시 선택(AND/OR) 같은 고급 필터는 다루지 않았다.
