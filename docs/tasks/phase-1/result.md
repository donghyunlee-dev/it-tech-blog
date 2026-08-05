# Result — Phase 1: 기반 설정

## 배달된 범위

PRD Phase 1(기반 설정)의 5개 체크리스트 항목 중, 실 자격증명 없이 완료 가능한 코드/설정 범위를 모두 구현했다.

- Next.js(App Router, TypeScript) 프로젝트 스캐폴딩과 GitHub Actions CI(lint+build) 워크플로
- 환경변수 조회 유틸리티(`requireEnv`)와 `.env.example`
- Auth.js(NextAuth) + Microsoft Entra ID Provider 설정(환경변수 기반)
- Confluence API 클라이언트 + `/api/health/confluence` 상태 확인 라우트
- Slack Incoming Webhook 알림 발송 모듈

## 변경/생성 파일

- `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `next-env.d.ts`, `.gitignore`, `.env.example`
- `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- `src/app/api/auth/[...nextauth]/route.ts`, `src/lib/auth.ts`
- `src/app/api/health/confluence/route.ts`, `src/lib/confluence/client.ts`
- `src/lib/notifications/slack.ts`
- `src/lib/env.ts`
- `.github/workflows/ci.yml`
- `docs/product/prd.md`(Phase 1 체크리스트 갱신)
- `docs/tasks/phase-1/{spec.md,plan.md,tasks.md,test-result.md,result.md}`(본 문서)

## 핵심 결정

- Auth.js(NextAuth) v5 베타를 사용하고, Microsoft Entra ID Provider의 자격증명은 `process.env`에서 직접 참조해 값이 없어도 모듈 임포트·빌드 시점에 실패하지 않도록 했다. 실제 로그인 시도가 있을 때만 OAuth 흐름이 실패하는 방식이다.
- Confluence 클라이언트와 Slack 알림 모듈은 `requireEnv`를 함수 호출 시점(런타임)에만 사용해, 자격증명이 없어도 빌드는 통과하고 실제 호출 시에만 명확한 오류를 던지도록 했다.
- `eslint-config-next` 16.3.0은 자체적으로 완전한 flat config 배열을 내보내므로, 기존에 일반적으로 쓰이던 `@eslint/eslintrc`의 `FlatCompat` 경유 방식을 쓰지 않고 `import nextConfig from "eslint-config-next"`로 직접 사용했다. `FlatCompat` 경유 시 ESLint 9.39.5에서 플러그인 설정 객체의 순환 참조로 인해 `Converting circular structure to JSON` 오류가 발생해 lint 자체가 실행되지 않는 문제를 확인했다.
- CI 워크플로는 GitHub Actions에서 install→lint→build만 수행한다. Vercel 배포는 Vercel 대시보드에서 저장소를 연결하면 Git 연동으로 자동 처리되는 방식이라 별도 워크플로 파일이 필요하지 않으며, 이 연결 자체는 사용자가 Vercel 계정으로 직접 수행해야 하는 외부 작업이다.

## 검증 결과

`docs/tasks/phase-1/test-result.md` 참고. 요약하면 `npm install`/`npm run lint`/`npm run build` 모두 통과했고, 홈 화면(200)과 Confluence health-check 라우트(자격증명 미설정 시 502 + 명확한 오류 메시지)를 로컬 dev 서버로 스모크 테스트했다.

## 열린 과제(Open Gaps)

- **Azure AD 앱 등록**: Azure Portal에서 앱 등록 후 `AUTH_MICROSOFT_ENTRA_ID_ID`/`_SECRET`/`_ISSUER` 값을 받아야 실제 로그인 검증이 가능하다.
- **Confluence 서비스 계정 API 토큰**: Confluence 관리자 화면에서 발급 후 `CONFLUENCE_BASE_URL`/`CONFLUENCE_EMAIL`/`CONFLUENCE_API_TOKEN`을 채워야 `/api/health/confluence`가 실제 연결을 확인할 수 있다.
- **Slack Incoming Webhook**: Slack 워크스페이스에서 채널용 Webhook URL을 발급해 `SLACK_WEBHOOK_URL`에 채워야 실제 알림 전송을 확인할 수 있다.
- **Vercel 프로젝트 연결 및 GitHub Actions 시크릿 등록**: 둘 다 각 서비스의 웹 대시보드에서 사용자가 직접 수행해야 하는 외부 설정이다.
- 위 자격증명이 준비되면, 이어서 각 연동의 실제 동작을 재검증하고 `docs/tasks/phase-1/test-result.md`와 `docs/product/prd.md`의 상태를 "완료"로 갱신해야 한다.

## Next Steps

- 사용자가 Azure AD/Confluence/Slack 자격증명을 준비해 로컬 `.env`에 채우면, 3개 항목("진행중")의 실 연동 검증을 이어서 진행할 수 있다.
- Phase 1 전체가 검증되면 PRD의 Phase 2(Editor 핵심 기능)로 진행 요청 가능.
