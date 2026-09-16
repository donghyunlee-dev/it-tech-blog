# result — 게시 주소 변경/삭제 시 리다이렉트 처리

## 요약

data-spec.md가 이미 설계해 둔 "publicSlug 마지막 `-` 뒤 36자 UUID로 역조회" 메커니즘을 실제로 구현해, prd.md/architecture.md의 SEO 요구사항("주소 변경·삭제 시 적절한 페이지로 연결")을 충족했다. 주소가 바뀐 문서는 현재 주소로 308 영구 리다이렉트하고, 실제로 삭제·게시 해제되었거나 애초에 없는 주소는 사이트 레이아웃을 갖춘 안내 화면으로 연결한다.

## 변경 파일

- `src/lib/viewer/posts.ts` — 상세 조립 로직을 `buildPostDetail`로 추출(기존 `getPublishedPostBySlug` 동작 유지), `extractTrailingUuid`·`resolvePostRoute` 추가
- `src/app/posts/[slug]/page.tsx` — `resolvePostRoute` 사용, `moved` 상태를 `permanentRedirect()`(308)로 처리
- `src/app/posts/[slug]/not-found.tsx`(신규) — 사이트 헤더/푸터 포함 안내 화면
- `docs/product/prd.md` — Phase V4 진행 상태 문구를 실제 구현 상태로 갱신(Slack 알림 기존 구현 확인 포함)

## 검증

- `npm run lint`/`npm run build` 통과
- 실제 게시 문서의 UUID를 재사용해 "주소만 바뀐 문서" 상황을 실 데이터 변경 없이 재현 → 308 리다이렉트로 현재 주소 도달 확인
- 완전 미존재 slug → 커스텀 안내 화면(404) 확인, 레이아웃 정상 렌더링 확인
- `GET /api/viewer/posts/{slug}` JSON API는 이번 변경 범위 밖으로 기존 동작(404) 유지 확인
- 상세는 [test-result.md](test-result.md) 참고

## 열린 과제

- Editor에서 실제로 slug를 바꾸는 전체 왕복은 실 프로덕션 Confluence 데이터를 건드리는 작업이라 이번 범위에서 실행하지 않았다 — 필요하면 사용자가 Editor에서 직접 slug를 바꿔본 뒤 리다이렉트를 최종 확인할 수 있다.
- Phase V4의 나머지 항목인 통합 QA는 여전히 별도 과제로 남아 있다.
