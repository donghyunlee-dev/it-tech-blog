# spec — Viewer publishMetadata/제목 조회 구조 수정

## 문제 정의

사용자가 실제 Confluence 스페이스(`ITTECHBLOG`, https://sfoodxproject.atlassian.net/wiki/spaces/ITTECHBLOG)에 연결이 되었는지 물어 직접 실 데이터를 조회한 결과, **연결 자체는 정상이지만 실제로 게시된 문서가 Viewer 목록·상세에 전혀 나타나지 않는 버그**를 발견했다.

원인: `src/lib/viewer/posts.ts`/`publish-metadata.ts`가 가정하던 `PublishMetadata` 구조(평면 `slug`/`metaDescription`/`targetViewers: string[]`)와 실제로 Editor(`sfood-it-editor`)가 Confluence에 쓰는 구조가 다르다. 배경 조사 에이전트로 Editor 저장소(`C:\Users\USER\projects\sfood-it-editor`, `src/lib/editor/publish.ts`/`documents.ts`)를 직접 읽어 실제 구현을 확인했고, 사용자가 "확인한 내용이 editor에서 변경된 내용이 맞다"고 재확인해 이 스펙대로 진행한다.

## 실제 구조 (Editor 코드 + 실 데이터로 확인)

- `publishMetadata` content property: `{ isPublished, publishedAt, viewers: Record<viewerId, { slug, metaDescription, publicSlug }> }`. `slug`는 작성자 입력값(유니크 보장 안 됨), `publicSlug`는 `${slug}-${페이지 UUID}` 형태로 서버가 생성하는 전역 유니크 값 — **공개 경로는 반드시 `publicSlug`를 써야 한다.**
- Confluence 페이지 자체의 `title`은 표시용이 아니라 무작위 UUID(스페이스 전체 제목 충돌을 원천 차단하기 위한 의도적 설계). 실제 표시 제목은 별도 content property `sourceDocument`의 `value.title`에 있다.
- `category`/`series`에 대응하는 content property는 없다. 태그는 Confluence 네이티브 페이지 레이블로 구현되어 있어(별도 API), content property 조회로는 얻을 수 없다.
- 상세 근거: [docs/product/data-spec.md](../../product/data-spec.md)의 2026-09-15 정정 반영분.

## 범위 (In Scope)

1. `src/lib/viewer/publish-metadata.ts`의 `PublishMetadata` 타입을 실제 구조로 교체.
2. `src/lib/viewer/posts.ts`: `sourceDocument.title`로 표시 제목 조회, `viewers["tech-blog"].publicSlug`를 공개 경로 slug로 사용하도록 목록/상세 조회 로직 수정.
3. `src/lib/comments/comments.ts`의 `getDocumentNotificationMeta`(댓글 알림 메일용 문서 메타 조회)도 동일한 버그가 있어 함께 수정.
4. 근거 없이 추측으로 추가했던 `category`/`series` optional 필드와 그 소비처(`PostCard`/`Hero`/상세 페이지의 키커·시리즈 위젯 분기, `SeriesWidget.tsx`)를 제거 — 실제 메커니즘이 없음이 확인됐으므로 화면에서도 걷어낸다.
5. `docs/product/data-spec.md`(Editor·Viewer 공유 계약 문서)를 실제 구조로 갱신.

## Out of Scope

- Confluence 페이지 레이블 조회 API 연동(카테고리/태그를 실제로 노출하려면 필요) — 별도 과제.
- Editor 저장소 자체의 수정 — 이번 확인은 읽기 전용 조사였고 Editor 코드는 건드리지 않는다.

## 수용 기준

- [ ] `/api/viewer/posts`가 실제 게시된 문서("Gemini에 SFOOD 업무 지침 설정하기")를 올바른 제목·slug로 반환한다.
- [ ] 홈 화면 히어로에 실제 제목이 뜬다(UUID 아님).
- [ ] `/posts/{publicSlug}` 상세 페이지가 정상 렌더링되고, 댓글 섹션도 실제 pageId로 정상 동작한다.
- [ ] `npm run lint`/`npm run build` 통과.
- [ ] `docs/product/data-spec.md`가 실제 구조를 반영한다.

## 엣지 케이스

- `viewers`에 `"tech-blog"` 키가 없는 문서(다른 Viewer 전용으로 게시된 문서): 목록에서 제외되어야 한다(정상 동작 — 필터 조건에 이미 포함됨).
- `sourceDocument` property가 없는(오래되었거나 비정상적인) 문서: `page.title`(UUID)로 폴백하되 크래시하지 않는다.

## 가정

- Editor의 이 구조는 현재 안정적으로 운영 중인 것으로 간주한다(사용자가 직접 확인). 향후 Editor가 구조를 다시 바꾸면 이 문서와 코드도 함께 갱신해야 한다.
