# spec — 카테고리/태그 노출 (Confluence 페이지 레이블)

## 문제 정의

design-direction.md의 시그니처 요소 ①(키커 라벨)은 실데이터가 없어 2026-09-15에 화면에서 제거됐다. 2026-09-16 조사([viewer-publish-metadata-fix](../viewer-publish-metadata-fix/))로 실제 메커니즘이 **Confluence 네이티브 페이지 레이블**(`GET /api/v2/pages/{id}/labels`)임을 확인했다. 실 게시 문서로 직접 조회해보니 게시글당 여러 개의 자유 형식 레이블이 붙어 있었다(예: `ai`, `업무`, `활용`, `개인`, `설정`, `가이드` 6개).

## 설계 변경: "키커(단일 카테고리)"가 아니라 "태그(다중)"

당초 design-direction.md는 키커를 "카테고리 하나"(예: `BACKEND`)를 전제로 설계했으나, 실제 데이터는 사전에 정한 카테고리 체계가 아니라 **작성자가 자유롭게 붙인 다중 태그**다. 하나만 뽑아 쓰면 임의적이므로(순서 보장 없음), 키커의 타이포그래피 언어(작은 대문자, 브랜드 레드, 제목과 한 세트)는 유지하되 **여러 개를 `·`로 이어 보여주는 태그 라인**으로 조정한다. 배지(pill)로 바꾸지 않는다 — ColorTag를 쓰지 않기로 한 기존 결정(design-system-adoption.md)과 같은 이유(제목과 한 세트로 읽히는 타이포그래피 정체성 유지).

## 범위 (In Scope)

1. `src/lib/confluence/client.ts`에 `listPageLabels(pageId)` 추가(`GET /api/v2/pages/{id}/labels`, 페이지네이션 대응).
2. `posts.ts`가 게시된 문서마다 레이블을 조회해 `tags: string[]`로 노출(최대 3개, 초과분은 생략).
3. `PostCard`/`Hero`/상세 페이지에 태그 라인 복원(`.kicker` 스타일 재사용, 값 없으면 생략 — 기존 "있으면 보너스" 원칙과 동일).
4. `data-spec.md`/`design-direction.md`를 실제 메커니즘으로 갱신.

## Out of Scope

- 태그 기반 필터링/검색(카테고리 pill row, 카운트 표시) — 이번엔 표시만 한다.
- `prefix`가 `global`이 아닌 레이블(팀/개인 전용 등) 처리 — 실 데이터에 전부 `global`이라 우선 `global`만 노출하고 나머지는 조회는 하되 필터링한다.

## 수용 기준

- [ ] 실제 게시 문서(레이블 있는 문서)에서 태그 라인이 제목 위에 표시된다.
- [ ] 레이블이 3개를 초과하면 처음 3개만 표시된다.
- [ ] 레이블이 없는 문서는 태그 라인 자체가 생략된다(빈 자리 없음).
- [ ] `npm run lint`/`npm run build` 통과.
- [ ] 실 데이터로 홈/상세 화면 회귀 확인.
