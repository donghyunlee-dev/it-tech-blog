# Tasks — Phase 2: Editor 핵심 기능

## 구현 작업

- [x] Confluence 클라이언트 확장(space/page/property/attachment/slug 검색) — `src/lib/confluence/client.ts`
- [x] Markdown → storage format 변환기 — `src/lib/editor/markdown.ts` (신규 의존성 `marked`)
- [x] 인증 가드 — `src/lib/auth-guard.ts`
- [x] 개인 폴더 도메인 로직 + `GET/POST /api/editor/folder`
- [x] 문서 목록/작성 도메인 로직 + `GET/POST /api/editor/documents`
- [x] 문서 수정 도메인 로직 + `PUT /api/editor/documents/{pageId}` (버전 충돌 409 포함)
- [x] 이미지 등록 도메인 로직 + `POST /api/editor/documents/{pageId}/images`
- [x] 게시 설정 도메인 로직 + `PATCH /api/editor/documents/{pageId}/publish` (slug 중복 409 포함)
- [x] 로그인 화면 — `src/app/login/page.tsx`
- [x] Editor 탐색기 화면 — `src/app/editor/page.tsx`
- [x] Editor 문서 편집 화면 — `src/app/editor/[pageId]/page.tsx`, `src/app/editor/new/page.tsx`, `src/components/editor/DocumentEditor.tsx`
- [x] Editor 게시 설정 화면 — `src/app/editor/[pageId]/publish/page.tsx`, `src/components/editor/PublishForm.tsx`
- [x] `.env.example`에 `CONFLUENCE_SPACE_KEY` 추가

## 테스트 작업

- [x] `npm run lint` 실행 및 결과 기록
- [x] `npm run build` 실행 및 결과 기록
- [x] 세션 없이 `/api/editor/*` 라우트 호출 시 401 응답 확인
- [x] `npm run dev`로 로그인/탐색기/편집/게시 화면 셸 렌더링 확인

## 문서화 작업

- [x] `docs/product/prd.md` Phase 2 체크리스트 상태·산출물 갱신
- [x] `docs/tasks/phase-2/test-result.md` 작성
- [x] `docs/tasks/phase-2/result.md` 작성

## 진행 상태

모든 항목 완료. 단, 실 Confluence 자격증명이 없어 실제 연동 동작(개인 폴더 생성, 문서 CRUD, 버전 충돌, 이미지 업로드, 게시 slug 중복 검사)의 라이브 검증은 이번 단계 범위에서 제외(test-result.md의 "미검증 항목" 참고).
