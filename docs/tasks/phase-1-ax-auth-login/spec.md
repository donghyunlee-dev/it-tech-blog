# Spec — Phase 1: AX Auth 경유 로그인 재구현

## 문제 정의

`docs/tasks/phase-1`에서 구현한 로그인 연동은 Microsoft Entra ID(Azure AD)와 Auth.js(NextAuth)가 직접 OIDC를 연동하는 방식으로 작성되어 있다. 이후 `docs/product/prd.md`/`architecture.md`가 갱신되어, 서비스는 Azure AD와 직접 연동할 수 없고 사내 공통 인증 서비스인 **AX Auth**가 Azure AD 로그인을 대행하는 방식을 채택하기로 확정했다. 기존 로그인 코드를 AX Auth 경유(리다이렉트 방식) 흐름에 맞게 재구현해야 한다.

## 비즈니스 배경

- 관련 문서: [prd.md](../../product/prd.md)(Phase 1 체크리스트, MS SSO 로그인 기능 정의), [architecture.md](../../product/architecture.md)(인증 방식), [login-integration-guide.md](../../product/login-integration-guide.md)(AX Auth 연동 스펙), [api-spec.md](../../product/api-spec.md)(`GET /api/auth/ax-callback` 명세)
- 백엔드(Next.js Route Handlers)가 있으므로 login-integration-guide.md의 두 방식 중 **리다이렉트 방식**(서버가 `clientSecret`과 함께 `login_token` 검증)을 사용한다.

## 범위 (In Scope)

1. `login_token`을 AX Auth 서버에 검증 요청하는 클라이언트 모듈
2. NextAuth(Auth.js) 설정을 Microsoft Entra ID Provider에서 AX Auth 기반 Credentials Provider로 교체
3. AX Auth 리다이렉트 콜백을 받는 Route Handler(`GET /api/auth/ax-callback`) — `login_token` 검증 → 세션 생성 → `/editor`로 리다이렉트, 실패 시 `/login?error=...`으로 리다이렉트
4. 로그인 페이지(`/login`)가 AX Auth의 로그인 시작 엔드포인트(`GET /auth/login/{clientId}`)로 이동하도록 수정
5. `.env.example` 등 환경변수 문서에 AX Auth 관련 값 반영

## 범위 제외 (Out of Scope)

- AX Auth `clientId`/`clientSecret` 발급 및 `redirect_uri` 등록(AX팀에 직접 요청해야 하는 외부 작업, 사용자가 직접 수행)
- 위 자격증명을 이용한 실제 로그인 흐름의 라이브 테스트(자격증명이 없어 이번 범위에서는 수행 불가)
- 댓글 알림 메일 발송 기능(Phase 4 범위, 별도 작업)
- Confluence API 토큰 발급, Slack Webhook 연결(Phase 1의 다른 체크리스트 항목, 이번 작업 범위 아님)

## 사용자/운영자 시나리오

- 미로그인 사용자가 `/login`에 접속해 "MS 계정으로 로그인" 링크를 클릭하면 AX Auth 로그인 화면으로 이동한다.
- 로그인 성공 시 AX Auth가 등록된 콜백 URL로 `login_token`과 함께 리다이렉트하고, 서버가 이를 검증해 세션을 생성한 뒤 `/editor`로 이동시킨다.
- 검증 실패(`TOKEN_EXPIRED`/`TOKEN_ALREADY_USED`/`TOKEN_NOT_FOUND` 등) 시 `/login`으로 되돌아가고 오류 안내가 노출된다.
- `src/lib/auth-guard.ts`의 `requireSessionEmail()`을 사용하는 기존 Editor API들은 provider 교체와 무관하게 동일하게 동작해야 한다(세션의 `email` 필드만 사용하므로 영향 없음).

## 완료 기준(Acceptance Criteria)

- `npm run lint`, `npm run build`가 AX Auth 자격증명 없이 성공한다.
- `src/lib/auth.ts`에 Microsoft Entra ID Provider가 남아있지 않고, AX Auth 기반 Credentials Provider로 교체되어 있다.
- `GET /api/auth/ax-callback` 라우트가 api-spec.md 명세대로 구현되어 있다(실 연동 여부는 검증하지 않음).
- `/login` 페이지가 AX Auth 로그인 URL로 이동하는 링크를 제공한다.
- `.env.example`에 AX Auth 관련 환경변수가 문서화되어 있고, Microsoft Entra ID 전용 변수는 제거되어 있다.
- `docs/product/prd.md`의 해당 체크리스트 항목 상태·산출물이 실제 구현 수준에 맞게 갱신된다.

## 엣지 케이스

- 콜백에 `login_token`이 아예 없는 경우(직접 URL 접근 등) → 로그인 페이지로 안내
- AX Auth 검증 응답이 실패(`valid: false`)인 경우 → 사유별 메시지 없이 공통 오류 안내(사유 코드는 서버 로그에만 남김)
- `authorize()`가 `null`을 반환하는 일반적인 실패 케이스와, AX Auth 서버 자체 호출 실패(네트워크 오류) 케이스를 모두 로그인 실패로 처리

## 가정 및 미확인 사항

- **콜백 쿼리 파라미터명 미확정**: AX Auth가 리다이렉트 시 `login_token`을 어떤 파라미터명으로 전달하는지 데모 가이드에 명시되어 있지 않다. 이번 구현은 `login_token`과 `loginToken` 두 파라미터명을 모두 시도하도록 구현하되, 실제 값 확인 전까지는 미검증 상태로 둔다.
- **`/auth/token/verify` 응답 형식 추정**: 팝업 릴레이(`verifyViaRelay`)가 `{ valid, email }`을 반환한다는 점에 근거해, 서버 검증(`/auth/token/verify`)도 `{ valid: boolean, email?: string, reason?: string }` 형태로 응답한다고 가정한다. 실제 스펙 확인 전까지는 미검증 상태로 둔다.
- NextAuth(Auth.js) v5(현재 설치된 `5.0.0-beta.32`)의 Credentials Provider와 세션 전략(JWT)을 그대로 사용한다.
