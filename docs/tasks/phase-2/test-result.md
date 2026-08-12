# Test Result — Phase 2: Editor 핵심 기능

## 실행한 검증

| 항목 | 명령/방법 | 결과 |
|---|---|---|
| 의존성 설치 | `npm install marked@^15` | 통과 (355 packages, 취약점 0건) |
| Lint | `npm run lint` | 통과 (경고/오류 없음 — 최초 실행 시 `<a>` 태그 경고 2건 발견 후 `next/link`로 수정, 재실행 통과) |
| 프로덕션 빌드 | `npm run build` | 통과 — 자격증명 없이도 성공. 13개 라우트 생성 확인(`/api/editor/folder`, `/api/editor/documents`, `/api/editor/documents/[pageId]`, `/api/editor/documents/[pageId]/images`, `/api/editor/documents/[pageId]/publish`, `/editor`, `/editor/[pageId]`, `/editor/[pageId]/publish`, `/editor/new`, `/login` 등) |
| 홈/로그인/탐색기 화면 스모크 테스트 | `npm run dev` 후 `GET /`, `GET /login`, `GET /editor` | 모두 200(탐색기는 미인증 시 `/login`으로 리다이렉트되어 200) |
| 세션 없이 Editor API 6개 호출 | `GET/POST /api/editor/folder`, `GET/POST /api/editor/documents`, `PUT /api/editor/documents/{id}`, `PATCH /api/editor/documents/{id}/publish`, `POST /api/editor/documents/{id}/images` | 모두 401 `{"error":{"code":"UNAUTHORIZED","message":"로그인이 필요합니다."}}` 반환 확인 |

### 스모크 테스트 중 발견 및 조치한 이슈

- 최초 스모크 테스트에서 `PUT/PATCH` 라우트가 404를 반환하는 현상을 발견했다. 원인은 이번 작업과 무관하게 이전 세션에서 남아있던 별도 `next dev` 프로세스(포트 3001, PID 9464)가 오래된 라우트 매니페스트를 물고 있던 것이었다. 해당 프로세스를 종료하고 `.next` 캐시를 제거한 뒤 새로 기동한 dev 서버에서는 6개 API 라우트 모두 정상적으로 401을 반환했다(코드 결함이 아님을 확인).

## 미검증 항목 (자격증명 부재로 이번 단계에서 수행 불가)

Phase 1과 동일하게 Azure AD/Confluence 서비스 계정 자격증명이 없어 다음 항목은 라이브 검증이 불가능하다.

- 실제 Confluence Space 홈페이지 하위 개인 폴더 생성/조회 동작(`getConfiguredSpace`, `findChildPageByTitle`)
- 문서 생성·수정 시 Confluence 페이지 생성/버전 갱신 동작 및 버전 충돌(409) 실제 재현
- 이미지 첨부파일 업로드(v1 REST API) 실제 동작
- 게시 설정 저장(content properties upsert)과 slug 중복 검사(`findPublishedPageBySlug`)의 실제 동작
- Markdown → Confluence storage format 변환 결과가 실제 Confluence 페이지에서 의도대로 렌더링되는지 여부(Viewer 컴포넌트 컨버터는 Phase 3 범위)
- Microsoft Entra ID 실제 로그인 후 세션 이메일이 `actualAuthorEmail`/개인 폴더 제목에 정확히 반영되는지 여부

자격증명이 준비되면 위 항목들을 재검증하고 이 문서에 결과를 추가해야 한다.

## 커버한 완료 기준(acceptance criteria)

- [x] `npm run lint`, `npm run build`가 자격증명 없이 성공한다.
- [x] api-spec.md에 정의된 6개 엔드포인트가 명세된 Request/Response 형태로 구현되어 있다.
  - [x] 인증 필요 라우트는 세션이 없으면 401을 반환한다(스모크 테스트로 확인).
  - [ ] 문서 수정 시 버전이 최신이 아니면 409를 반환한다(코드 구현 완료, 실 Confluence 연동 없이는 재현 불가 — 미검증).
  - [ ] 게시 시 slug/metaDescription 누락 시 400, slug 중복 시 409를 반환한다(코드 구현 완료, 실 Confluence 연동 없이는 재현 불가 — 미검증).
- [x] 로그인/탐색기/편집/게시 설정 4개 화면이 존재하고 design-system.md의 색상·타이포그래피·카드 스타일을 따른다.
- [x] data-spec.md에 정의된 Document/Publish Metadata 구조가 Confluence 페이지·content properties에 매핑되어 저장되도록 구현되어 있다(실 저장 결과는 미검증).
- [x] prd.md의 Phase 2 체크리스트가 이번 구현 결과에 맞게 갱신된다.
