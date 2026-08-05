# Test Result — Phase 1: 기반 설정

## 실행한 검증

| 항목 | 명령/방법 | 결과 |
|---|---|---|
| 의존성 설치 | `npm install` | 통과 (353 packages, 취약점 0건) |
| Lint | `npm run lint` | 통과 (경고/오류 없음) |
| 프로덕션 빌드 | `npm run build` | 통과 — 자격증명 없이도 성공. 라우트 4개 생성 확인(`/`, `/_not-found`, `/api/auth/[...nextauth]`, `/api/health/confluence`) |
| 홈 화면 스모크 테스트 | `npm run dev` 후 `GET /` | 200 OK |
| Confluence 연동 실패 처리 확인 | `npm run dev` 후 `GET /api/health/confluence` (환경변수 미설정 상태) | 502 응답, `{"status":"error","message":"환경변수 CONFLUENCE_BASE_URL이(가) 설정되지 않았습니다..."}` — 크래시 없이 명확한 오류로 처리됨 확인 |

## 미검증 항목 (자격증명 부재로 이번 단계에서 수행 불가)

- Microsoft Entra ID 실제 로그인 플로우(OIDC 인가 코드 교환, 세션 발급)
- Confluence 서비스 계정 API 토큰을 이용한 실제 연동(`/api/health/confluence`가 실제로 `status: "ok"`를 반환하는지)
- Slack Incoming Webhook을 통한 실제 알림 전송
- GitHub Actions CI 워크플로의 실제 실행 결과(로컬에서 동일한 `npm ci && npm run lint && npm run build` 절차로 대체 검증함)

자격증명이 준비되면 위 항목들을 재검증하고 이 문서에 결과를 추가해야 한다.

## 커버한 완료 기준(acceptance criteria)

- [x] `npm run lint`, `npm run build`가 자격증명 없이 성공한다.
- [x] NextAuth 설정에 Microsoft Entra ID Provider가 환경변수 기반으로 등록되어 있다.
- [x] Confluence API 클라이언트와 `/api/health/confluence` 라우트가 구현되어 있다(실 연동 여부는 검증하지 않음).
- [x] Slack 알림 발송 유틸리티가 구현되어 있다.
- [x] `.env.example`에 필요한 모든 환경변수가 문서화되어 있다.
- [x] GitHub Actions CI 워크플로가 push/PR 시 lint·build를 실행하도록 구성되어 있다(로컬 재현으로 대체 검증, 실제 GitHub Actions 실행은 미검증).
