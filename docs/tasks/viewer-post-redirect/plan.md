# plan — 게시 주소 변경/삭제 시 리다이렉트 처리

## 접근 방식

`src/lib/viewer/posts.ts`가 이미 한 번의 `listPublishedEntries()` 호출로 전체 게시 문서를 메모리에 올려두므로, 그 결과 안에서 slug 정확 일치 → (실패 시) UUID 접미사로 역조회 순서로 처리한다. 기존 `getPublishedPostBySlug`(API 라우트가 사용, 동작 변경 없음)와 상세 조립 로직을 공유하기 위해 내부 헬퍼로 추출한다.

## 영향 범위

- `src/lib/viewer/posts.ts`:
  - 상세 조립 로직을 `buildPostDetail(entries, matchIndex, slug)` 내부 함수로 추출(기존 `getPublishedPostBySlug` 동작은 그대로 유지).
  - `extractTrailingUuid(slug)`: 마지막 `-` 뒤 36자가 UUID 형식이면 그 값을, 아니면 `null`을 반환.
  - `resolvePostRoute(slug)`(신규, export): slug 정확 일치 시 `{ status: "found", post }`, 없으면 UUID 역조회로 `{ status: "moved", currentSlug }` 또는 `{ status: "not-found" }` 반환.
- `src/app/posts/[slug]/page.tsx`: `loadPost`가 `resolvePostRoute`를 호출하도록 교체. `moved` 상태면 `permanentRedirect()`(308)로 이동. `generateMetadata`도 같은 결과 타입을 재사용(이동/없음/오류는 기존과 동일하게 fallback 메타데이터).
- `src/app/posts/[slug]/not-found.tsx`(신규): `SiteHeader`/`SiteFooter` + `.empty-state` 안내 문구 + 홈 링크.
- `docs/product/prd.md`: Phase V4 진행 상태 문단 추가(Slack 알림 기존 구현 확인, rate limiting·리다이렉트 완료, 통합 QA는 남은 과제로 명시).

## 검증 전략

1. `npm run lint`, `npm run build`.
2. 실 게시 문서 하나를 Editor에서 slug만 변경한 뒤, 옛 `publicSlug`로 접근 시 308 리다이렉트로 새 URL에 도달하는지 확인.
3. 완전히 존재하지 않는 slug, UUID 패턴이 아예 아닌 slug 두 경우 모두 새 안내 화면이 뜨는지 확인.
4. `GET /api/viewer/posts/{slug}`(JSON API)는 기존과 동일하게 404만 반환하는지(회귀 없음) 확인.

## 리스크

- Editor에서 실제로 slug를 변경해 보는 검증은 Editor 저장소를 통해서만 가능하다 — 로컬에 Editor 저장소가 있어 필요 시 활용하되, 사용자 소유 실 Confluence 데이터를 건드리는 작업이라 실행 전 확인을 구한다.
- `permanentRedirect()`는 Next.js App Router의 예외 기반 흐름(`NEXT_REDIRECT`)을 사용하므로, try/catch로 감싼 `loadPost` 내부가 아니라 페이지 컴포넌트 최상위에서 호출해야 한다(내부에서 호출하면 catch에 걸려 "오류"로 잘못 처리될 위험) — 구현 시 주의.
