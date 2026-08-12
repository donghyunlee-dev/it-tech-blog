# Plan — Phase 2: Editor 핵심 기능

## 접근 방식

Phase 1에서 만든 `src/lib/confluence/client.ts`(단일 함수 `getCurrentConfluenceUser`)를 페이지/속성/첨부파일 조작이 가능한 클라이언트로 확장하고, 그 위에 도메인 계층(`src/lib/editor/*`)을 두어 api-spec.md의 6개 라우트가 도메인 함수만 호출하도록 구성한다. 라우트는 요청 파싱·인증 검사·HTTP 응답 매핑만 담당하고(경계 처리), Confluence 호출·데이터 변환 로직은 도메인/클라이언트 계층에 둔다(development-rules.md의 경계-로직 분리 원칙).

화면은 Next.js App Router 페이지로 구성하며, 서버 컴포넌트에서 세션을 확인해 미인증 시 로그인 화면으로 리다이렉트하고, 클라이언트 컴포넌트에서 API를 호출해 폼 상태를 관리한다.

## 영향 영역

### Confluence 클라이언트 확장 — `src/lib/confluence/client.ts`
- `getSpace()`: `CONFLUENCE_SPACE_KEY` 기준 space id/homepageId 조회 (`GET /wiki/api/v2/spaces?keys=`)
- `findChildPageByTitle(parentId, title)` / `listChildPages(parentId)`: (`GET /wiki/api/v2/pages/{id}/children`)
- `getPage(pageId)` / `createPage(...)` / `updatePage(...)`: (`GET/POST/PUT /wiki/api/v2/pages`)
- `getPageProperty(pageId, key)` / `upsertPageProperty(pageId, key, value)`: (`GET/POST/PUT /wiki/api/v2/pages/{id}/properties`)
- `uploadAttachment(pageId, file)`: (`POST /rest/api/content/{id}/child/attachment`, v1 — spec.md 가정 참고)
- `findPageBySlug(slug)`: 게시 slug 중복 확인. Confluence CQL은 content property의 JSON 필드(`slug`) 검색을 신뢰성 있게 지원하지 않아, Space 내 페이지 목록을 페이지네이션으로 조회하며 각 페이지의 `publishMetadata` 속성을 확인하는 방식으로 구현한다(architecture.md의 "소규모 팀" 전제상 문서 수가 적어 허용 가능한 접근으로 판단, 문서 수 증가 시 재검토 필요 — plan.md 리스크 참고)

### 신규 — `src/lib/editor/`
- `folder.ts`: `ensurePersonalFolder(email)`, `getPersonalFolder(email)` — 개인 폴더 조회/생성 도메인 로직
- `documents.ts`: `listDocuments(folderId)`, `createDocument(...)`, `updateDocument(...)`, `getDocumentDetail(pageId)` — Document(data-spec.md) 매핑. Confluence 페이지의 `body.storage`는 렌더링용 산출물(Markdown→storage 변환 결과)로만 쓰고, 재편집을 위한 원본은 별도 content property(`sourceMarkdown`)에 함께 저장해 편집 화면이 항상 원본 Markdown을 불러오도록 한다
- `images.ts`: `registerImage(pageId, file)`
- `publish.ts`: `setPublishState(pageId, input)` — Publish Metadata(data-spec.md) 매핑, slug 유니크 검증
- `markdown.ts`: Markdown → Confluence storage format 변환(신규 의존성 `marked` 사용)
- `types.ts`: Document/PublishMetadata 등 api-spec.md 응답 형태에 대응하는 타입

### 신규 — 인증 경계
- `src/lib/auth-guard.ts`: `requireSession()` — 세션 없으면 401 JSON 응답을 던지는 공통 가드(모든 `/api/editor/*` 라우트에서 재사용)

### 신규 — API 라우트 (api-spec.md 계약 그대로)
- `src/app/api/editor/folder/route.ts` (GET, POST)
- `src/app/api/editor/documents/route.ts` (GET, POST)
- `src/app/api/editor/documents/[pageId]/route.ts` (PUT)
- `src/app/api/editor/documents/[pageId]/images/route.ts` (POST)
- `src/app/api/editor/documents/[pageId]/publish/route.ts` (PATCH)

### 신규 — 화면
- `src/app/login/page.tsx`
- `src/app/editor/page.tsx` (탐색기)
- `src/app/editor/[pageId]/page.tsx` (편집)
- `src/app/editor/[pageId]/publish/page.tsx` (게시 설정)
- 공용 스타일: `src/app/globals.css`에 design-system.md 기준 카드/버튼 유틸리티 클래스 추가

### 환경변수
- `.env.example`에 `CONFLUENCE_SPACE_KEY` 추가

## 데이터/인터페이스 영향

- data-spec.md의 Document는 Confluence Page(v2)로, Publish Metadata는 페이지의 content property(`publishMetadata` 키)로, `actualAuthorEmail`은 별도 content property(`authorMeta` 키)로 매핑한다.
- api-spec.md에 정의된 6개 엔드포인트의 Request/Response JSON 형태를 그대로 구현 대상 계약으로 삼는다. 라우트 자체의 입출력은 이번 계획으로 변경하지 않는다.
- Confluence 첨부파일 업로드만 v1 REST API를 사용하는 점을 예외로 기록한다(spec.md 가정).

## 검증 전략

- `npm run lint`, `npm run build`: 자격증명 없이 통과해야 한다(Phase 1과 동일하게 함수 호출 시점에만 `requireEnv` 사용).
- 로컬 dev 서버에서 인증 없이 각 `/api/editor/*` 라우트를 호출해 401 응답을 확인한다(자격증명·세션이 없는 상태에서 가능한 유일한 스모크 테스트).
- 실제 Confluence 페이지 생성/수정/게시/이미지 업로드는 서비스 계정 토큰이 없어 이번 단계에서 라이브 검증이 불가능하다 — test-result.md에 미검증 항목으로 명시한다.
- 화면은 `npm run dev`로 기동해 로그인 리다이렉트, 탐색기 빈 상태, 편집 폼 렌더링을 육안으로 확인한다(실 데이터 없이 UI 셸 수준 확인).

## 리스크

- Confluence Cloud REST API v2의 정확한 요청/응답 필드는 실 토큰으로 검증하기 전까지 공식 문서 기준 가정에 의존한다. 특히 첨부파일 업로드는 v1/v2 혼용이라 실제 연동 시 조정이 필요할 수 있다.
- Markdown → storage format 변환은 표준 요소만 지원하는 최소 구현이라, Confluence 전용 매크로(정보 패널 등)는 이번 단계에서 다루지 않는다(Phase 3 컴포넌트 컨버터와는 반대 방향 변환이며 범위가 다름).
- 개인 폴더를 "Space 홈페이지 하위"로 고정하는 가정은 실제 Confluence Space 구조가 다를 경우(예: 홈페이지가 없는 Space) 재설계가 필요할 수 있다.
