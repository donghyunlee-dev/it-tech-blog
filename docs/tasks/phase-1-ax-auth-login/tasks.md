# Tasks — Phase 1: AX Auth 경유 로그인 재구현

## 구현 작업

- [x] `src/lib/ax-auth/client.ts` 작성(`getAxAuthLoginUrl`, `verifyLoginToken`)
- [x] `src/lib/auth.ts`를 Credentials Provider(AX Auth) 기반으로 재작성
- [x] `src/app/api/auth/ax-callback/route.ts` 작성
- [x] `src/app/login/page.tsx`를 AX Auth 로그인 URL 링크로 수정
- [x] `.env.example` 갱신(Microsoft Entra ID 변수 제거, AX Auth 변수 추가)

## 테스트 작업

- [x] `npm run lint` 실행 및 결과 기록
- [x] `npm run build` 실행 및 결과 기록
- [x] 미검증 항목(실 AX Auth 자격증명 필요) 명시

## 문서화 작업

- [x] `docs/product/prd.md` Phase 1 체크리스트 상태·산출물 갱신
- [x] `docs/tasks/phase-1-ax-auth-login/test-result.md` 작성
- [x] `docs/tasks/phase-1-ax-auth-login/result.md` 작성

## 진행 상태

모든 항목 완료. 단, 실 AX Auth 자격증명(clientId/clientSecret/redirect_uri) 부재로 실제 로그인 왕복 검증은 이번 범위에서 제외(test-result.md의 "미검증 항목" 참고).
