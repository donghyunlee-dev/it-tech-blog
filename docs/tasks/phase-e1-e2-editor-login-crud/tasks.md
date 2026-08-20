# Tasks — Phase E1/E2: Editor AX Auth 로그인 연동 및 문서 CRUD 검증

## 구현 작업

- [x] `src/lib/confluence/client.ts`에 `deletePage` 추가
- [x] `src/lib/editor/documents.ts`에 `deleteDocument` 추가
- [x] `src/app/api/editor/documents/[pageId]/route.ts`에 `DELETE` 핸들러 추가
- [x] `src/components/editor/DocumentEditor.tsx`에 삭제 버튼·확인창·삭제 후 `/editor` 이동 추가

## 테스트 작업

- [x] `npm run lint` 실행
- [x] `npm run build` 실행
- [x] 로컬 dev 서버 + Browser 도구로 로그인 페이지 → "MS 계정으로 로그인" 클릭 → AX Auth → 실제 `login.microsoftonline.com` 도달 확인(실 자격증명 입력 전 단계까지)
- [x] 실 Confluence 자격증명으로 문서 생성·조회·수정·버전 충돌(409)·삭제·삭제 후 목록 제외까지 실제 API 호출로 검증(스크래치패드 스크립트, 저장소에는 남기지 않음)
- [x] 테스트용으로 생성한 Confluence 페이지(임시 폴더 포함) 정리(삭제)
- [x] Editor 문서 API가 미인증 요청을 401로 거부하는지 curl로 확인

## 문서화 작업

- [x] `docs/product/prd.md` Phase E1/E2 관련 항목 상태 갱신
- [x] `docs/tasks/phase-e1-e2-editor-login-crud/{spec.md,plan.md,tasks.md,test-result.md,result.md}` 작성

## 진행 상태

코드 구현·정적 검증·Confluence 실 연동 검증 모두 완료. 실 MS 계정 로그인을 통한 브라우저 UI 클릭 테스트(작성/수정/삭제 버튼)는 사용자의 자격증명 입력이 필요해 이번 세션에서 제외(test-result.md, result.md의 "열린 과제" 참고).
