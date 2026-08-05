# Tasks — Phase 1: 기반 설정

## 구현 작업

- [x] Next.js(App Router, TypeScript) 프로젝트 스캐폴딩(package.json, tsconfig, next.config, ESLint, .gitignore)
- [x] GitHub Actions CI 워크플로(`.github/workflows/ci.yml`) 추가: install → lint → build
- [x] 환경변수 유틸리티(`src/lib/env.ts`)와 `.env.example` 작성
- [x] Auth.js(NextAuth) 설정(`src/lib/auth.ts`) + Microsoft Entra ID Provider 등록 + 라우트 핸들러
- [x] Confluence API 클라이언트(`src/lib/confluence/client.ts`) + `/api/health/confluence` 라우트
- [x] Slack Webhook 알림 모듈(`src/lib/notifications/slack.ts`)

## 테스트 작업

- [x] `npm run lint` 실행 및 결과 기록
- [x] `npm run build` 실행 및 결과 기록
- [x] 환경변수 누락 시 각 모듈이 명확한 오류를 던지는지 확인(health-check 라우트 스모크 테스트로 확인)

## 문서화 작업

- [x] `docs/product/prd.md` Phase 1 체크리스트 상태·산출물 갱신
- [x] `docs/tasks/phase-1/test-result.md` 작성
- [x] `docs/tasks/phase-1/result.md` 작성

## 진행 상태

모든 항목 완료. 단, Azure AD/Confluence/Slack 실 연동 검증은 자격증명 부재로 이번 단계 범위에서 제외(test-result.md의 "미검증 항목" 참고).
