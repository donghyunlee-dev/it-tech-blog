# plan — Viewer publishMetadata/제목 조회 구조 수정

## 접근 방식

Editor 저장소를 직접 읽어 확인한 실제 데이터 구조에 Viewer의 읽기 로직을 맞춘다. Editor 쪽은 수정하지 않는다(Viewer는 읽기 전용 소비자).

## 영향 범위

- `src/lib/viewer/publish-metadata.ts`: `PublishMetadata`를 `{ isPublished, publishedAt?, viewers: Record<string, PublishViewerMetadata> }`로, `PublishViewerMetadata`를 `{ slug, metaDescription, publicSlug }`로 재정의. `category`/`series` 제거.
- `src/lib/viewer/posts.ts`:
  - `VIEWER_ID = "tech-blog"` 상수 추가(export — `comments.ts`에서도 재사용).
  - `SourceDocument` 인터페이스(`{ title: string }`) 추가(export).
  - `listPublishedEntries()`: 페이지마다 `publishMetadata` 조회 후 `viewers[VIEWER_ID]`가 있고 `isPublished`인 것만, 그 다음 `sourceDocument`를 추가 조회해 표시 제목을 얻는다(게시된 것만 2차 조회하므로 N+1 부담 적음).
  - `listPublishedPosts()`/`getPublishedPostBySlug()`: `slug` 대신 `viewerMeta.publicSlug`로 매칭·응답.
  - `category`/`series` 필드 및 관련 유틸 제거.
- `src/lib/comments/comments.ts`의 `getDocumentNotificationMeta()`: 동일하게 `sourceDocument.title` + `viewers[VIEWER_ID].publicSlug`로 수정(댓글 알림 메일에 UUID 제목이 나가는 것을 방지).
- `src/components/posts/PostCard.tsx`, `Hero.tsx`, `src/app/posts/[slug]/page.tsx`: `category`/`series` 분기 제거.
- `src/components/posts/SeriesWidget.tsx`: 삭제(호출부가 없어짐 + 실제 데이터 소스가 없음이 확인됨).
- `src/app/globals.css`: `SeriesWidget` 전용 CSS(`.series-*`) 제거.
- `docs/product/data-spec.md`: Document/Publish Metadata 절을 실제 구조로 갱신, Source Document 절 추가.

## 검증 전략

1. `npm run lint`, `npm run build`.
2. 로컬 `.env`가 실제 `ITTECHBLOG` 스페이스를 가리키고 있음을 이용해, 수정 전/후 `curl localhost:PORT/api/viewer/posts` 비교(수정 전 빈 배열 → 수정 후 실제 문서 1건).
3. 브라우저로 홈 화면 히어로, 상세 페이지(`/posts/{publicSlug}`), 댓글 섹션(실제 pageId)까지 직접 렌더링 확인.

## 리스크

- Editor가 이후 `publishMetadata`/`sourceDocument` 구조를 다시 바꿀 수 있다 — 두 저장소가 코드를 공유하지 않으므로(architecture.md) 이런 드리프트는 구조적으로 재발 가능하다. 근본 대응(계약 테스트, 공유 스키마 등)은 이번 범위를 넘어서며 별도 논의가 필요하다.
- `sourceDocument`가 없는 레거시 문서는 `page.title`(UUID)로 폴백되어 화면에 UUID가 노출될 수 있다 — 실제로 그런 문서가 있는지는 확인하지 않았다(현재 게시된 문서 1건은 정상적으로 `sourceDocument`를 가지고 있음).
