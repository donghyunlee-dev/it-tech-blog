# Plan — Phase 1: 기반 설정

## 접근 방식

architecture.md의 기술 스택(Next.js/TypeScript, Auth.js, Confluence REST API v2, Slack Webhook)을 그대로 따라 저장소에 애플리케이션 골격을 새로 만든다. 실 자격증명이 없는 현재 상태를 감안해, 모든 외부 연동 코드는 환경변수를 함수 호출 시점에 조회하도록 작성하여 자격증명 없이도 `lint`/`build`가 통과하도록 한다.

## 영향 영역

- 저장소 루트: `package.json`, `tsconfig.json`, `next.config.ts`, ESLint 설정, `.gitignore`, `.env.example` (신규)
- `src/app/`: App Router 기본 레이아웃/홈 페이지, NextAuth 라우트 핸들러 (신규)
- `src/lib/`: `env.ts`(환경변수 유틸), `auth.ts`(NextAuth 설정), `confluence/client.ts`(Confluence API 클라이언트), `notifications/slack.ts`(Slack 알림) (신규)
- `.github/workflows/ci.yml` (신규)
- `docs/product/prd.md`: Phase 1 체크리스트 상태 갱신 (기존 파일 수정)

## 데이터/인터페이스 영향

- 이번 단계에서는 Confluence를 통한 실제 데이터 CRUD가 없으므로 data-spec.md의 엔티티는 아직 사용하지 않는다.
- api-spec.md에 정의된 정식 엔드포인트(`/api/editor/*`, `/api/viewer/*`, `/api/comments`)는 Phase 2~4에서 구현하며, 이번 단계에서는 그 전제가 되는 인증·Confluence·Slack 연동 모듈과 상태 확인용 `/api/health/confluence`만 추가한다(api-spec.md에는 없는 내부 점검용 라우트).

## 검증 전략

- `npm run lint`: ESLint 통과 여부 확인
- `npm run build`: TypeScript 컴파일 및 Next.js 프로덕션 빌드 성공 여부 확인(자격증명 없이 통과해야 함)
- 코드 리뷰 수준에서 NextAuth/Confluence/Slack 모듈이 환경변수 누락 시 명확한 오류를 던지는지 확인
- 실제 Azure AD 로그인, Confluence API 연결, Slack Webhook 전송은 자격증명이 없어 이번 단계에서 라이브 검증 불가 — test-result.md에 미검증 항목으로 명시

## 리스크

- Auth.js(NextAuth) v5는 API가 안정화 중이라 이후 버전 업그레이드 시 설정 변경이 필요할 수 있다.
- Confluence Cloud REST API v2의 정확한 엔드포인트·인증 헤더 형식은 실 토큰으로 검증 전까지 가정에 기반한다.
- 자격증명 없이 진행하므로, 이번 단계 완료가 곧 "연동 완료"를 의미하지 않는다. prd.md 체크리스트에는 코드 준비 상태와 실 연동 검증 대기 상태를 구분하여 기록한다.
