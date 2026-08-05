# Spec — Phase 1: 기반 설정

## 문제 정의

`docs/product/prd.md`의 Phase 1(기반 설정)은 Editor·Viewer·Comment 기능을 개발하기 전에 프로젝트 골격, 인증 연동, Confluence/Slack 연동 코드, 환경변수 관리 체계를 먼저 갖추도록 정의하고 있다. 현재 저장소에는 문서만 있고 애플리케이션 코드가 전혀 없다.

## 비즈니스 배경

- 관련 문서: [docs/product/prd.md](../../product/prd.md), [docs/product/architecture.md](../../product/architecture.md)
- 2주 내 구축 목표(architecture.md)에 따라 Editor/Viewer/Comment 개발에 착수하기 전 공통 기반을 최소 구성으로 빠르게 준비해야 한다.

## 범위 (In Scope)

1. Next.js(App Router, TypeScript) 프로젝트 초기 설정
2. GitHub Actions CI 워크플로(install → lint → build) 구성
3. Microsoft Entra ID OIDC 연동을 위한 Auth.js(NextAuth) 설정 코드(환경변수 기반, Provider 등록)
4. Confluence Cloud REST API 클라이언트 모듈 + 연결 상태 확인용 health-check API 라우트
5. Slack Incoming Webhook 알림 발송 모듈
6. 환경변수 목록 문서화(`.env.example`)와 필수값 누락 시 명확한 오류를 내는 환경변수 조회 유틸리티

## 범위 제외 (Out of Scope)

- Azure AD 앱 등록, Confluence API 토큰 발급, Slack Webhook URL 발급 등 외부 포털에서 이루어지는 실제 자격증명 발급 작업(사용자가 직접 수행)
- 위 자격증명을 이용한 실제 로그인/연결 라이브 테스트(자격증명이 없어 이번 범위에서는 수행 불가)
- Vercel 프로젝트 생성·연결(Vercel 대시보드에서 사용자가 직접 수행)
- Editor/Viewer/Comment 화면 및 비즈니스 로직(Phase 2 이후 범위)

## 사용자/운영자 시나리오

- 개발자가 저장소를 clone한 뒤 `.env.example`을 참고해 로컬 `.env`를 채우면 즉시 개발을 시작할 수 있어야 한다.
- 자격증명이 없는 상태에서도 `npm run build`, `npm run lint`가 성공해야 한다(빌드 타임에 실제 시크릿을 요구하지 않음).
- 실제 자격증명이 채워진 뒤에는 Confluence health-check 라우트를 호출해 연동 정상 여부를 확인할 수 있어야 한다.

## 완료 기준(Acceptance Criteria)

- `npm run lint`, `npm run build`가 자격증명 없이 성공한다.
- NextAuth 설정에 Microsoft Entra ID Provider가 환경변수 기반으로 등록되어 있다.
- Confluence API 클라이언트와 `/api/health/confluence` 라우트가 구현되어 있다(실 연동 여부는 검증하지 않음).
- Slack 알림 발송 유틸리티가 구현되어 있다.
- `.env.example`에 필요한 모든 환경변수가 문서화되어 있다.
- GitHub Actions CI 워크플로가 push/PR 시 lint·build를 실행하도록 구성되어 있다.
- prd.md의 Phase 1 체크리스트 상태가 실제 완료 수준(코드 완료 vs 실 연동 검증 대기)에 맞게 갱신된다.

## 엣지 케이스

- 환경변수가 없는 상태에서의 빌드(성공해야 함) vs 실제 라우트 호출 시(명확한 오류 메시지로 실패해야 함)
- CI 워크플로에 시크릿이 아직 등록되지 않은 상태에서도 lint/build 단계는 통과해야 한다.

## 가정

- 실제 Azure AD/Confluence/Slack 자격증명은 이후 사용자가 별도로 준비해 로컬 `.env` 및 GitHub/Vercel 시크릿에 등록한다.
- Next.js 최신 안정 버전과 Auth.js(NextAuth) v5 계열을 기준으로 구현한다.
