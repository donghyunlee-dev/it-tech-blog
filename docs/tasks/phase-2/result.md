# Result — Phase 2: Editor 핵심 기능

## 배달된 범위

PRD Phase 2(Editor 핵심 기능)의 6개 체크리스트 항목을 api-spec.md·data-spec.md 계약에 맞춰 모두 구현했다. Phase 1과 동일하게 실 Confluence 자격증명이 없는 상태에서도 lint/build가 통과하도록 작성했으며, 세션 없이 각 API를 호출했을 때 401이 반환되는 것을 스모크 테스트로 확인했다.

- 개인 폴더 확인/생성(`/api/editor/folder`)
- 문서 탐색기 목록 조회(`/api/editor/documents` GET)
- 문서 작성·저장(`/api/editor/documents` POST, Markdown → Confluence storage format 변환)
- 문서 수정(`/api/editor/documents/{pageId}` PUT, 버전 충돌 409 처리)
- 이미지 등록(`/api/editor/documents/{pageId}/images` POST)
- 게시 상태·노출 Viewer·SEO 설정(`/api/editor/documents/{pageId}/publish` PATCH, slug 중복 409 처리)
- 화면 4종: 로그인, Editor 탐색기, 문서 편집(신규/기존 공용), 게시 설정

## 변경/생성 파일

- Confluence 클라이언트 확장: `src/lib/confluence/client.ts` (space/page/property/attachment/slug 조회 함수, `ConfluenceApiError` 추가)
- 도메인 계층(신규): `src/lib/editor/{errors,folder,documents,images,publish,markdown}.ts`
- 경계 계층(신규): `src/lib/auth-guard.ts`, `src/lib/api-response.ts`
- API 라우트(신규): `src/app/api/editor/folder/route.ts`, `src/app/api/editor/documents/route.ts`, `src/app/api/editor/documents/[pageId]/route.ts`, `src/app/api/editor/documents/[pageId]/images/route.ts`, `src/app/api/editor/documents/[pageId]/publish/route.ts`
- 화면(신규): `src/app/login/page.tsx`, `src/app/editor/page.tsx`, `src/app/editor/new/page.tsx`, `src/app/editor/[pageId]/page.tsx`, `src/app/editor/[pageId]/publish/page.tsx`
- 컴포넌트(신규): `src/components/editor/DocumentEditor.tsx`, `src/components/editor/PublishForm.tsx`
- 스타일: `src/app/globals.css`(design-system.md 기준 카드/버튼/입력/목록 유틸리티 클래스 추가)
- 의존성: `package.json`에 `marked` 추가
- 환경변수: `.env.example`에 `CONFLUENCE_SPACE_KEY` 추가
- 문서: `docs/product/prd.md`(Phase 2 체크리스트 갱신), `docs/tasks/phase-2/{spec.md,plan.md,tasks.md,test-result.md,result.md}`(본 문서)

## 핵심 결정

- **개인 폴더 위치**: Confluence Space 홈페이지(루트) 바로 아래에 사용자 이메일을 제목으로 하는 페이지를 개인 폴더로 사용한다. 이를 위해 `CONFLUENCE_SPACE_KEY` 환경변수를 신설했다.
- **Markdown 원본 보존**: Confluence 페이지의 `body.storage`는 렌더링용 산출물(Markdown → storage format 변환 결과)로만 쓰고, 재편집을 위한 원본 Markdown은 별도 content property(`sourceMarkdown`)에 함께 저장한다. 그렇지 않으면 편집 화면이 변환된 HTML을 다시 Markdown처럼 보여주게 되어 재편집 시 내용이 깨진다.
- **이미지 첨부**: Confluence Cloud REST API v2에는 첨부파일 업로드 엔드포인트가 없어 v1 REST API(`/rest/api/content/{id}/child/attachment`)를 예외적으로 사용했다. 편집기에는 `confluence-attachment://{filename}` 형태의 내부 참조로 이미지를 삽입하고, storage format 변환 시 이를 `<ac:image>` 매크로로 치환한다.
- **slug 중복 검사**: Confluence CQL이 content property의 JSON 필드 검색을 신뢰성 있게 지원하지 않아, Space 내 페이지를 순회하며 `publishMetadata` 속성을 확인하는 방식으로 구현했다. 소규모 팀(architecture.md) 전제상 허용 가능한 접근이나, 문서 수가 크게 늘어나면 재검토가 필요하다.
- **오류 응답 일원화**: 도메인 계층에서 `ValidationError`/`NotFoundError`/`ConflictError`/`UnauthorizedError`를 던지고, `src/lib/api-response.ts`가 이를 api-spec.md의 공통 에러 형식과 상태 코드(400/401/404/409)로 변환한다. 분류되지 않은 오류(Confluence 연동 실패 등)는 502로 처리한다.
- **서버 컴포넌트에서 도메인 계층 직접 호출**: 탐색기·편집·게시 설정 화면(서버 컴포넌트)은 자체 API를 fetch하지 않고 `src/lib/editor/*` 도메인 함수를 직접 호출한다. 클라이언트 컴포넌트(`DocumentEditor`, `PublishForm`)만 저장/게시 시 API를 호출한다.

## 검증 결과

`docs/tasks/phase-2/test-result.md` 참고. 요약하면 `npm install`/`npm run lint`/`npm run build` 모두 통과했고, 세션 없이 Editor API 6개를 호출했을 때 모두 401을 반환하는 것을 확인했다. 스모크 테스트 과정에서 이전 세션의 잔여 dev 서버 프로세스가 오래된 라우트 매니페스트를 물고 있어 일부 라우트가 일시적으로 404를 반환하는 현상을 발견했으나, 해당 프로세스를 종료하고 재기동한 뒤에는 정상 동작을 확인했다(코드 결함 아님).

## 열린 과제(Open Gaps)

- **Confluence Space Key 및 홈페이지 확인**: `CONFLUENCE_SPACE_KEY`에 실제 Space Key를 채우고, 해당 Space에 홈페이지가 설정되어 있는지 확인해야 개인 폴더 생성이 동작한다.
- **실 Confluence 연동 검증 전체**: 개인 폴더 생성/조회, 문서 CRUD, 버전 충돌(409), 이미지 첨부, 게시 설정과 slug 중복 검사(409)는 실 서비스 계정 토큰이 준비된 뒤 재검증이 필요하다.
- **Markdown → storage format 변환 범위**: 표준 Markdown 요소만 지원하며, Confluence 전용 매크로(정보 패널 등)는 다루지 않는다. 필요 시 별도 요청으로 확장을 검토해야 한다.
- **문서 탐색기 트리 깊이**: 현재는 개인 폴더 하위 문서를 1단계로만 조회한다. 폴더 하위에 폴더를 추가로 두는 다단계 구조가 필요하면 별도 요청으로 확장해야 한다.

## Next Steps

- 사용자가 Confluence Space Key와 Phase 1의 Confluence/Azure AD 자격증명을 `.env`에 채우면, 이번 단계에서 미검증으로 남은 실 연동 동작을 재검증할 수 있다.
- Phase 2 전체가 검증되면 PRD의 Phase 3(Viewer 핵심 기능)으로 진행 요청 가능.
