# result — Viewer publishMetadata/제목 조회 구조 수정

## 요약

사용자가 실제 Confluence 스페이스(`ITTECHBLOG`) 연결 여부를 물어 직접 실 데이터를 조회하다가, **연결은 정상이지만 실제 게시된 문서가 Viewer에 전혀 노출되지 않는 버그**를 발견했다. 원인은 Editor가 실제로 쓰는 `publishMetadata`/`sourceDocument` 데이터 구조가 Viewer가 가정하던 구조와 달랐던 것 — 배경 조사 에이전트로 Editor 저장소 소스를 직접 읽어 정확한 실제 구조를 확인했고, 사용자 확인 후 Viewer의 읽기 로직과 `data-spec.md`를 실제 구조에 맞춰 고쳤다. 수정 후 실제 문서("Gemini에 SFOOD 업무 지침 설정하기")가 홈 화면·상세 페이지·댓글 섹션 전부에서 정상 노출됨을 확인했다.

## 발견한 문제

1. **`publishMetadata` 구조 불일치**: Viewer는 평면 `{ isPublished, slug, metaDescription, targetViewers: string[] }`를 기대했지만, 실제로는 `{ isPublished, publishedAt, viewers: { "tech-blog": { slug, metaDescription, publicSlug } } }` — slug/metaDescription이 viewer별로 중첩되어 있었다. Viewer의 필터 조건(`property.value.slug` 존재 여부)이 항상 실패해 게시된 문서가 조용히 목록에서 빠졌다.
2. **표시 제목 불일치**: Confluence 페이지 자체의 `title`은 Editor가 의도적으로 무작위 UUID를 채워둔 값(스페이스 전체 제목 충돌 방지용, 표시용 아님)인데, Viewer는 이 값을 그대로 제목으로 썼다. 실제 표시 제목은 별도 content property `sourceDocument.title`에 있었다.
3. **공개 경로 slug 불일치**: 작성자가 입력한 `slug`는 유니크가 보장되지 않는다. 실제 공개 경로에 써야 하는 값은 서버가 `${slug}-${페이지 UUID}` 형태로 생성하는 `publicSlug`였다.
4. **댓글 알림 메일의 동일 버그**: `comments.ts`의 `getDocumentNotificationMeta`도 같은 방식으로 문서 제목·URL을 잘못 조회하고 있었다(발송 자체는 별도 미해결 과제라 영향이 늦게 드러났을 것).
5. **`category`/`series`는 애초에 근거 없는 추측이었음이 확인됨**: 이번 조사로 Editor에 태그/카테고리는 Confluence 네이티브 페이지 레이블로 구현되어 있고(content property 아님), 시리즈 개념 자체가 없음을 확인했다. 이전 세션에서 낙관적으로 추가해뒀던 `PublishMetadata.category`/`.series` optional 필드와 그 소비 코드(`SeriesWidget.tsx` 포함)를 제거했다.

## 조사 방법 (신뢰도 근거)

벤더/타 저장소의 변경 주장을 그대로 믿지 않는다는 이번 세션의 원칙을 여기서도 적용했다: 실 Confluence REST API로 스페이스의 페이지 15개를 전수 조회하고 각각의 content property를 직접 curl로 확인해 버그를 재현한 뒤, 배경 조사 에이전트로 `C:\Users\USER\projects\sfood-it-editor`(Editor 저장소, 로컬에 존재)의 실제 소스 코드(`src/lib/editor/publish.ts`, `documents.ts`)를 직접 읽어 정확한 타입 정의와 `publicSlug` 생성 알고리즘을 확인했다. 추측으로 고치지 않았다.

## 변경 파일

- `src/lib/viewer/publish-metadata.ts` — `PublishMetadata`/`PublishViewerMetadata` 타입을 실제 구조로 교체, `category`/`series` 제거
- `src/lib/viewer/posts.ts` — `sourceDocument.title`/`viewers["tech-blog"].publicSlug` 기반으로 조회 로직 재작성, `VIEWER_ID`/`SourceDocument` export 추가
- `src/lib/comments/comments.ts` — `getDocumentNotificationMeta`를 동일하게 수정
- `src/components/posts/PostCard.tsx`, `Hero.tsx`, `src/app/posts/[slug]/page.tsx` — `category`/`series` 분기 제거
- `src/components/posts/SeriesWidget.tsx` — 삭제(호출부 소멸 + 실제 데이터 소스 없음 확인)
- `src/app/globals.css` — `SeriesWidget` 전용 CSS 제거
- `docs/product/data-spec.md` — Document/Publish Metadata/Source Document 절을 실제 구조로 갱신

## 검증

- `npm run lint`, `npm run build` 통과
- `curl /api/viewer/posts` → 실제 문서가 올바른 제목·slug로 반환됨을 확인
- 브라우저로 홈 히어로·상세 페이지(`/posts/{publicSlug}`)·댓글 섹션(실제 pageId)까지 실제 렌더링 확인, 콘솔 에러 없음
- 상세 근거는 [test-result.md](test-result.md) 참고

## 열린 과제

- **카테고리/태그 노출**: 실제 메커니즘(Confluence 페이지 레이블)이 확인됐으니, 원하면 레이블 조회 API(`GET /pages/{id}/labels`) 연동을 별도 과제로 진행할 수 있다 — 그러면 [viewer-editorial-ui](../viewer-editorial-ui/)에서 만든 키커(`.kicker`) 스타일을 다시 살릴 수 있다.
- **Editor-Viewer 데이터 계약 드리프트**: 두 저장소가 코드를 공유하지 않아(architecture.md) 이런 구조 불일치가 문서화 없이 발생했다. 재발 방지책(계약 테스트, 공유 스키마 패키지 등)은 이번 범위 밖이며 별도 논의가 필요하다.
- `sourceDocument`가 없는 문서의 UUID 제목 폴백 경로는 실제 사례로 검증하지 못했다.
- 이번 조사로 스페이스에 있던 나머지 14개 페이지 중 1개(`d82361ca-...`)는 `isPublished:false`(초안), 13개는 `publishMetadata` 자체가 없는(미게시 또는 개인 폴더 등) 문서로 확인됐다 — 정상적인 상태다.
