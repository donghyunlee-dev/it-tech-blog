# plan — 카테고리/태그 노출

## 접근 방식

기존 게시 문서 스캔 흐름(publishMetadata → sourceDocument 순으로 이미 게시된 것만 추가 조회)에 레이블 조회를 한 단계 더 추가한다. `listAllSpacePages` / `listFooterComments`와 동일한 커서 페이지네이션 패턴을 그대로 따른다.

## 영향 범위

- `src/lib/confluence/client.ts`: `listPageLabels(pageId): Promise<ConfluencePageLabel[]>` 추가.
- `src/lib/viewer/posts.ts`:
  - `listPublishedEntries()`에서 `sourceDocument`와 함께 레이블도 병렬 조회(`Promise.all`).
  - `prefix === "global"`인 레이블만 `name` 추출, 최대 3개로 자른 `tags: string[]` 필드를 `PublishedPostSummary`/`PublishedPostDetail`에 추가.
- `src/components/posts/PostCard.tsx`, `Hero.tsx`, `src/app/posts/[slug]/page.tsx`: `tags`가 있으면 `.kicker` 클래스로 `tags.join(" · ")` 렌더링, 없으면 생략.
- `docs/product/data-spec.md`: Publish Metadata 절 근처에 "태그는 Confluence 페이지 레이블" 설명을 실제 조회 방식(`GET /pages/{id}/labels`)으로 구체화.
- `docs/guide/design-direction.md`: 키커를 "단일 카테고리"에서 "다중 태그(최대 3개, `·` 구분)"로 조정한 근거 기록.

## 검증 전략

1. `npm run lint`, `npm run build`.
2. 실 게시 문서(레이블 6개 있는 문서, 레이블 없는 문서 각각)로 태그 라인 노출 여부 확인.
3. 홈 카드 그리드·히어로·상세 페이지 전부 확인.

## 리스크

- 게시 문서마다 API 호출이 1건(레이블 조회) 늘어난다 — 이미 `sourceDocument` 조회로 늘어난 것과 같은 패턴이라 추가 위험은 낮다(ISR 60초 캐시로 완화).
- 레이블 순서는 Confluence API가 보장하지 않으므로, 매번 같은 3개가 뜬다는 보장은 없다(현재로선 허용 가능한 수준으로 판단).
