# Plan — Phase 3: Viewer 핵심 기능

## 영향 범위

- `src/lib/confluence/client.ts` (추가: `listAllSpacePages`)
- `src/lib/viewer/posts.ts`, `converter.ts`, `related-sites.ts` (신규)
- `src/app/api/viewer/posts/route.ts`, `src/app/api/viewer/posts/[slug]/route.ts` (신규)
- `src/app/page.tsx` (교체: 플레이스홀더 → Viewer 홈)
- `src/app/posts/[slug]/page.tsx` (신규: Viewer 문서 상세)
- `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/rss.xml/route.ts` (신규)
- `src/app/globals.css` (본문 렌더링용 클래스 추가: 코드/패널/표)
- `.env.example` (`SITE_BASE_URL` 추가)
- `docs/product/prd.md` (Phase 3 체크리스트 갱신)

기존 Editor 코드(`src/lib/editor/*`, `src/app/editor/*`)는 수정하지 않는다(읽기 전용으로 `publishMetadata` content property만 참조).

## 기술적 접근

1. **`listAllSpacePages(spaceId)`**: 기존 `findPublishedPageBySlug`의 페이지네이션 로직과 동일한 방식으로 Space의 전체 페이지를 조회해 배열로 반환하는 함수를 `confluence/client.ts`에 추가한다. `findPublishedPageBySlug`는 그대로 두고 새 함수를 추가하는 방식으로, 기존 동작을 변경하지 않는다.

2. **`src/lib/viewer/posts.ts`**:
   - `listPublishedEntries()`: Space의 전체 페이지를 조회하고, 각 페이지의 `publishMetadata` content property를 확인해 `isPublished && slug`인 것만 모아 `publishedAt` 내림차순으로 정렬한다(`findPublishedPageBySlug`와 동일한 순회 방식 — 소규모 팀 기준 성능은 architecture.md 트레이드오프에서 이미 허용된 접근).
   - `listPublishedPosts()`: 목록 화면/`GET /api/viewer/posts`/sitemap/RSS가 공통으로 쓰는 요약 정보(`slug`, `title`, `publishedAt`)를 반환한다.
   - `getPublishedPostBySlug(slug)`: 일치하는 항목이 없으면 `NotFoundError`. 있으면 `getPage`로 본문을 가져와 컨버터를 적용하고, canonical URL(`{SITE_BASE_URL}/posts/{slug}`)과 관련 글(현재 글을 제외한 최신 3건)을 함께 반환한다.

3. **`src/lib/viewer/converter.ts`**: Confluence storage format(XHTML) 문자열을 정규식 기반으로 변환한다.
   - `ac:structured-macro`의 `code`/`info`/`note`/`warning`/`tip`을 각각 `<pre class="viewer-code">`, `<div class="viewer-panel viewer-panel-{name}">`로 변환.
   - `<table>`에 `viewer-table` 클래스를 부여.
   - 매핑되지 않는 `ac:`/`ri:` 네임스페이스 태그는 제거하되 내부 리치 텍스트는 유지(예외 상황: "매핑되지 않는 컴포넌트는 기본 스타일로 대체 노출").
   - 마지막으로 `<script>` 태그, 인라인 이벤트 핸들러(`on*=`), `javascript:` 스킴을 제거하는 최소 방어 처리를 적용한다(완전한 sanitizer는 아님 — spec.md 가정 참고).
   - 별도 HTML 파서 라이브러리는 추가하지 않는다(CLAUDE.md의 "불필요한 의존성 추가 지양" 원칙, 기존 저장소도 `marked`만 사용).

4. **`src/lib/viewer/related-sites.ts`**: `{ name, url }` 배열을 상수로 정의한다. `url`은 실제 값을 알 수 없으므로 빈 문자열로 두고, 렌더링 시 `url`이 있는 항목만 표시한다.

5. **API 라우트**: 기존 Editor 라우트와 동일한 패턴(로컬 `RouteContext` 인터페이스, `toErrorResponse`)을 따른다. 인증 불필요(비로그인 공개).

6. **화면**:
   - `src/app/page.tsx`: `listPublishedPosts()`를 호출해 카드 목록 렌더링(기존 `doc-list`/`card` 클래스 재사용). 게시 문서가 없으면 `empty-state` 클래스로 안내.
   - `src/app/posts/[slug]/page.tsx`: `getPublishedPostBySlug()` 호출, `generateMetadata`로 title/description/`alternates.canonical` 설정, 본문은 `dangerouslySetInnerHTML`로 렌더링(컨버터가 이미 정제한 HTML), JSON-LD(`<script type="application/ld+json">`)와 관련 글·연관 사이트 링크 섹션 포함. 존재하지 않으면 Next.js `notFound()`로 404 처리.

7. **SEO 파일**: `src/app/sitemap.ts`/`robots.ts`는 Next.js 특수 파일 컨벤션(`MetadataRoute.Sitemap`/`MetadataRoute.Robots`)을 사용한다(node_modules/next/dist/docs 확인 완료). RSS는 대응하는 특수 파일이 없어 `src/app/rss.xml/route.ts`에서 직접 XML 문자열을 생성해 반환한다.

## 검증 전략

- `npm run lint`, `npm run build` (Confluence 자격증명 없이 통과해야 함 — Phase 1/2와 동일 기준).
- 로컬 dev 서버(Browser 미리보기)로 Confluence 자격증명이 없는 상태에서 각 화면·라우트가 502(Confluence 연동 실패)로 명확히 응답하는지 확인한다(크래시가 아니라 `toErrorResponse`의 502로 처리되는지).
- 실제 Confluence 데이터로 목록/상세/sitemap/RSS 콘텐츠가 올바르게 채워지는지는 실 자격증명이 없어 이번 범위에서 검증하지 못한다.

## 리스크

- Confluence storage format 변환은 정규식 기반이라, 실제 Confluence에서 생성되는 복잡한 중첩 매크로(예: 매크로 안에 매크로)는 완벽히 처리되지 않을 수 있다. Editor의 문서 작성 기능이 현재 Markdown 텍스트 편집 수준의 최소 구현이라(Phase 2 result.md 참고) 당장 발생 가능한 매크로 종류는 제한적이다.
- `listPublishedEntries()`가 Space의 모든 페이지를 순회하며 각각 content property를 조회하므로, 문서 수가 많아지면 응답이 느려질 수 있다(기존 `findPublishedPageBySlug`와 동일한 특성). 필요 시 이후 단계에서 캐시(ISR)나 조회 최적화를 검토한다.
