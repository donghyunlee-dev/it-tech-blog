# plan — 태그 기반 필터링/검색

## 접근 방식

새 데이터 조회 로직을 추가하지 않는다 — `listPublishedPosts()`가 이미 문서마다 `tags: string[]`를 채워 반환하므로, API 응답에 그대로 노출하고 태그 집계(건수)는 이미 그 목록을 받는 클라이언트(`SearchOverlay`)와 서버(아카이브 페이지)에서 각각 가볍게 계산한다.

## 영향 범위

- `src/app/api/viewer/posts/route.ts`: 응답 매핑에 `tags: post.tags` 추가.
- `docs/product/api-spec.md`: `GET /api/viewer/posts` 응답 스키마에 `tags` 필드 문서화.
- `src/app/tags/[tag]/page.tsx`(신규): `listPublishedPosts()`를 직접 호출(별도 API 경유 없이 서버 컴포넌트에서 바로) → URL의 태그와 대소문자 무관하게 일치하는 게시글만 필터 → 홈과 동일한 `PostCard` 그리드로 렌더링. `generateMetadata`로 타이틀 설정. `revalidate = 60`(홈/상세와 동일한 ISR 주기).
- `src/components/layout/SearchOverlay.tsx`: `SearchPost`에 `tags: string[]` 추가, `useMemo`로 태그별 건수 집계, 두 번째 `CommandGroup`("태그")을 조건부로 추가(태그가 하나도 없으면 그룹 자체를 생략).
- `src/app/posts/[slug]/page.tsx`: 키커 렌더링을 `post.tags.join(" · ")` 텍스트에서 각 태그를 `<Link href="/tags/{encodeURIComponent(tag)}">`로 감싸고 " · "로 구분하는 형태로 변경.

## 검증 전략

1. `npm run lint`, `npm run build`.
2. `GET /api/viewer/posts` 응답에 `tags`가 포함되는지 curl로 확인.
3. 실 태그가 있는 문서 기준으로 `/tags/{태그}` 접속 시 해당 게시글만 보이는지 확인.
4. 존재하지 않는 태그로 접근 시 빈 상태 안내가 뜨는지 확인(오류 아님).
5. 브라우저로 Cmd/Ctrl+K 검색창을 열어 "태그" 그룹 노출, 태그 입력 시 필터링, 태그 선택 시 이동을 확인.
6. 상세 페이지에서 태그 클릭 시 아카이브 페이지로 이동하는지 확인.

## 리스크

- 태그명에 URL에 쓰기 까다로운 문자(한글, 공백 등)가 있을 수 있어 `encodeURIComponent`/`decodeURIComponent`로 왕복하되, 대소문자 비교는 소문자로 정규화해 비교한다(Confluence 레이블이 항상 같은 대소문자로 오는지 보장되지 않음).
- 태그 그룹 추가로 검색 결과 항목 수가 늘어나지만, 현재 게시 문서/태그 수가 적어(3건) 성능 영향은 무시할 수 있는 수준이다.
