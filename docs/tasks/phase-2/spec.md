# Spec — Phase 2: Editor 핵심 기능

## 문제 정의

`docs/product/prd.md`의 Phase 2(Editor 핵심 기능)는 사내 직원이 로그인 후 자신의 개인 폴더에서 문서를 작성·수정·게시 설정할 수 있게 하는 것을 목표로 한다. Phase 1에서 인증(Auth.js + Microsoft Entra ID)과 Confluence 연동 기반(클라이언트, health-check)만 마련된 상태이며, 실제 Editor 화면과 문서 CRUD 로직은 아직 없다.

## 비즈니스 배경

- 관련 문서: [prd.md](../../product/prd.md), [architecture.md](../../product/architecture.md), [data-spec.md](../../product/data-spec.md), [api-spec.md](../../product/api-spec.md)
- Phase 1 결과(`docs/tasks/phase-1/result.md`)에 따라 Azure AD/Confluence/Slack 실 자격증명은 아직 준비되지 않았다. 이번 단계도 자격증명 없이 코드·빌드가 통과해야 하며, 실 연동 검증은 자격증명이 준비된 뒤로 이연한다.

## 범위 (In Scope)

prd.md Phase 2에 정의된 6개 기능을 api-spec.md의 엔드포인트 계약과 data-spec.md의 데이터 구조를 그대로 따라 구현한다.

1. 개인 폴더 확인/생성 — `GET/POST /api/editor/folder`
2. 문서 목록 조회(탐색기) — `GET /api/editor/documents`
3. 문서 작성·저장 — `POST /api/editor/documents`
4. 문서 수정 — `PUT /api/editor/documents/{pageId}`
5. 이미지 등록 — `POST /api/editor/documents/{pageId}/images`
6. 게시 상태·노출 Viewer·SEO 정보 설정 — `PATCH /api/editor/documents/{pageId}/publish`

화면 정의(prd.md)에 따른 다음 화면도 함께 구현한다.

- 로그인 화면(MS 로그인 버튼)
- Editor 탐색기(대시보드): 개인 폴더의 문서 목록, 새 문서 작성 버튼
- Editor 문서 편집 화면: Markdown 편집, 이미지 업로드, 저장
- Editor 게시 설정 화면: 게시 토글, Viewer 선택, slug/메타 설명 입력

## 범위 제외 (Out of Scope)

- Viewer 화면·공개 열람 로직, Confluence 컴포넌트 컨버터, sitemap/robots/RSS (Phase 3)
- 댓글(Comment) 기능 전체 (Phase 4)
- 이상 감지 Slack 알림 연동, rate limiting, 리다이렉트 처리 (Phase 5)
- 실 Azure AD/Confluence 자격증명을 이용한 라이브 통합 테스트(자격증명 부재로 수행 불가 — Phase 1과 동일한 제약)
- 리치 블록 에디터(WYSIWYG) 도입 — 2주 일정과 최소 구성 원칙에 따라 Markdown 텍스트 편집 + 미리보기 수준으로 한정

## 사용자/운영자 시나리오

- 로그인한 사내 직원이 처음 Editor에 진입하면 개인 폴더가 없을 경우 자동으로 생성되고, 있으면 그대로 탐색기에 진입한다.
- 사용자가 탐색기에서 "새 문서" 버튼을 눌러 문서를 작성하고 저장하면 Confluence 페이지로 생성되어 탐색기 목록에 나타난다.
- 사용자가 기존 문서를 열어 내용을 수정하고 저장하면 Confluence 페이지가 갱신된다. 다른 세션에서 먼저 수정해 버전이 어긋난 경우, 최신 버전 확인 후 재저장하라는 안내를 받는다.
- 사용자가 문서 편집 중 이미지를 업로드하면 본문에 삽입할 수 있는 참조가 반환되어 편집 내용에 반영된다.
- 사용자가 문서를 게시 설정 화면에서 게시 처리하면 slug·메타 설명이 검증된 뒤 Confluence content properties에 저장되고, 이후 Phase 3 Viewer가 이를 조회할 수 있는 상태가 된다.

## 완료 기준(Acceptance Criteria)

- `npm run lint`, `npm run build`가 자격증명 없이 성공한다.
- api-spec.md에 정의된 6개 엔드포인트가 명세된 Request/Response 형태로 구현되어 있다.
  - 인증 필요 라우트는 세션이 없으면 401을 반환한다.
  - 문서 수정 시 버전이 최신이 아니면 409를 반환한다.
  - 게시 시 slug/metaDescription 누락 시 400, slug 중복 시 409를 반환한다.
- 로그인/탐색기/편집/게시 설정 4개 화면이 존재하고 design-system.md의 색상·타이포그래피·카드 스타일을 따른다.
- data-spec.md에 정의된 Document/Publish Metadata 구조가 Confluence 페이지·content properties에 매핑되어 저장된다.
- prd.md의 Phase 2 체크리스트가 이번 구현 결과(코드 완료 vs 실 연동 검증 대기)에 맞게 갱신된다.

## 엣지 케이스

- 개인 폴더가 이미 존재하는 상태에서 생성 재시도 → 409
- 문서가 없는 상태에서 탐색기 진입 → 빈 상태 안내
- 동시 수정으로 인한 버전 충돌 → 409, 최신 버전 안내
- 게시 시 필수 SEO 값 누락 또는 slug 중복 → 400/409로 게시 차단
- 허용되지 않는 이미지 파일 형식 또는 파일 누락 → 400
- Confluence API 호출 자체가 실패하는 경우(네트워크/자격증명 문제) → 502로 일관되게 응답

## 가정

- 개인 폴더는 Confluence Space의 홈페이지(루트) 바로 아래에 사용자 이메일을 제목으로 하는 페이지로 표현한다. Space Key는 신규 환경변수 `CONFLUENCE_SPACE_KEY`로 관리한다.
- 문서 작성 화면은 Markdown 입력을 받아 Confluence storage format(XHTML 기반)으로 변환해 저장한다. 변환은 표준 Markdown 요소(제목, 목록, 강조, 코드블록, 링크, 이미지)만 지원한다.
- 이미지 첨부는 Confluence v1 REST API(`/rest/api/content/{id}/child/attachment`)를 사용한다. Confluence Cloud REST API v2에는 아직 첨부파일 업로드 엔드포인트가 없어 이번 구현에서는 v1을 함께 사용하며, 이는 api-spec.md의 "Confluence Cloud REST API v2" 기준에 대한 실무적 예외로 plan.md에 명시한다.
- `actualAuthorEmail`(실제 작성자)은 별도 DB 없이 Confluence content property로 문서에 함께 저장한다.
- 실 자격증명이 없는 현재 상태에서는 Confluence API 응답 형식에 대한 가정(v2 API 스펙 문서 기준)을 코드에 반영하며, 실 토큰 확보 후 재검증이 필요하다.
