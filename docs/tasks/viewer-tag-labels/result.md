# result — 카테고리/태그 노출

## 요약

design-direction.md의 시그니처 요소 ①(키커 라벨)을 실데이터로 되살렸다. 실제 메커니즘은 Confluence 네이티브 페이지 레이블(`GET /api/v2/pages/{id}/labels`)이며, 사전에 정한 카테고리 하나가 아니라 작성자가 자유롭게 붙인 다중 태그임을 실 데이터로 확인했다 — 그래서 "카테고리 하나"가 아니라 "태그 최대 3개를 `·`로 이어 보여주는" 형태로 설계를 조정했다.

## 변경 파일

- `src/lib/confluence/client.ts` — `listPageLabels(pageId)` 추가
- `src/lib/viewer/posts.ts` — 게시 문서마다 레이블 병렬 조회, `tags: string[]`(최대 3개, `prefix: "global"`만) 노출
- `src/components/posts/PostCard.tsx`, `Hero.tsx`, `src/app/posts/[slug]/page.tsx` — `.kicker`로 태그 라인 렌더링(값 없으면 생략)
- `docs/product/data-spec.md`, `docs/guide/design-direction.md` — 실제 구조·설계 조정 근거 기록

## 검증

- `npm run lint`/`npm run build` 통과
- 실 게시 문서(레이블 있음 2건, 없음 1건)로 홈·상세 화면 확인 — 태그 라인이 있을 때만 정상 노출, 없으면 자연스럽게 생략
- 상세는 [test-result.md](test-result.md) 참고

## 열린 과제

- 태그 기반 필터링/검색(카테고리 pill row + 카운트)은 이번 범위에 포함하지 않았다 — 검색 오버레이(`CommandPalette`)에 태그 필터를 추가하려면 별도 작업이 필요하다.
- 레이블 순서는 Confluence API가 보장하지 않아, 같은 문서라도 호출마다 앞 3개가 달라질 가능성이 이론적으로 있다(실사용에서 문제 되면 그때 정렬 기준을 정한다).
- `prefix`가 `global`이 아닌 레이블(팀/개인 전용 등)은 현재 조회는 하되 화면에는 노출하지 않는다 — 실 데이터에는 아직 그런 사례가 없어 검증하지 못했다.
