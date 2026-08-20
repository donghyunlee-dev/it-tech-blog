# Spec — Phase E1/E2: Editor AX Auth 로그인 연동 및 문서 CRUD 검증

## 목표

- Editor 서비스의 로그인을 AX Auth 리다이렉트 방식(팝업 아님)으로 연결한다: MS 로그인 버튼 클릭 → AX Auth 서비스 호출(`GET /auth/login/{clientId}`) → 로그인 완료 후 콜백 경로(`/api/auth/ax-callback`)로 즉시 이동.
- Editor의 문서 작성(Create)·수정(Update)·삭제(Delete)가 실제 Confluence 연동까지 포함해 정확히 동작하는 것을 확인한다.

## 배경

- 로그인 리다이렉트 흐름 자체는 이전 작업(`docs/tasks/phase-1-ax-auth-login/`)에서 이미 구현되어 있었다. 이번 작업에서는 실 자격증명(`.env`에 사용자가 채워 넣은 값)으로 그 흐름이 실제로 동작하는지 재검증한다.
- 문서 작성(Create)·수정(Update)은 Phase 2에서 이미 구현되어 있었다. **삭제(Delete) 기능은 이번 작업 전까지 코드베이스 어디에도 없었다** — Confluence 클라이언트, 도메인 계층, API 라우트, UI 전부에 삭제 경로가 없었다.

## 범위

- 포함:
  - `deletePage`(Confluence 클라이언트) / `deleteDocument`(도메인 계층) / `DELETE /api/editor/documents/{pageId}`(API 라우트) / 삭제 버튼(`DocumentEditor` UI) 신규 구현.
  - AX Auth 로그인 리다이렉트 흐름의 실 동작 확인(등록된 clientId로 MS 로그인 화면까지 도달하는지).
  - 문서 생성·조회·수정·버전 충돌 감지·삭제·삭제 후 목록 제외까지 실제 Confluence Cloud 인스턴스(`ITTECHBLOG` space)에 대한 통합 테스트.
- 제외(범위 밖):
  - 실제 MS 계정 자격증명 입력을 통한 전체 브라우저 E2E 로그인 완료 — 보안 정책상 AI가 사용자 대신 로그인 자격증명을 입력할 수 없다. 사용자가 직접 완료해야 하는 단계다.
  - Editor/Viewer 저장소 분리(마이그레이션)는 이번 작업 범위가 아니다(별도 후속 작업).

## 완료 기준(Done Criteria)

- `npm run lint`, `npm run build` 통과.
- 로그인 페이지의 "MS 계정으로 로그인" 링크가 실제 등록된 AX Auth clientId로 올바른 리다이렉트 URL을 생성하고, 클릭 시 실제 MS SSO 로그인 화면까지 도달함을 확인.
- 문서 생성 → 조회 → 수정 → (구버전으로 재수정 시 409 충돌) → 삭제 → 목록에서 제외까지, 실제 Confluence API 호출로 전체 흐름이 성공함을 확인.
- Editor 문서 API(`GET/POST /api/editor/documents`, `PUT/DELETE /api/editor/documents/{pageId}`)가 인증되지 않은 요청을 401로 거부함을 확인.

## 가정 및 미확인 사항

- Confluence DELETE 호출이 첫 시도에서 드물게 500을 반환하는 현상을 관찰했다(직후 재시도는 204 성공). Confluence Cloud 측의 일시적 지연으로 추정되며, 재현 빈도나 원인이 명확하지 않아 이번 범위에서 재시도 로직을 추가하지 않았다(test-result.md 참고).
- 실제 로그인 세션을 통한 브라우저상의 Editor UI 작성·수정·삭제 클릭 테스트는 사용자의 실 MS 로그인 완료가 필요해 이번 세션에서 완료하지 못했다(Next Steps 참고).
