# Result — Phase 1: AX Auth 경유 로그인 재구현

## 배달된 범위

`docs/product/prd.md` Phase 1 체크리스트의 "AX Auth 경유 로그인 연동" 항목을, 기존 Microsoft Entra ID 직접 OIDC 연동 코드에서 AX Auth 리다이렉트 방식 연동으로 재구현했다. 실제 AX Auth 자격증명 없이 완료 가능한 코드 범위를 모두 구현했다.

## 변경/생성 파일

- `src/lib/ax-auth/client.ts`(신규): `getAxAuthLoginUrl()`, `verifyLoginToken()`
- `src/lib/auth.ts`: `MicrosoftEntraID` Provider 제거, AX Auth 기반 `Credentials` Provider(`id: "ax-auth"`)로 교체, `pages.signIn`을 `/login`으로 지정
- `src/app/api/auth/ax-callback/route.ts`(신규): AX Auth 로그인 콜백 처리
- `src/app/login/page.tsx`: 서버 액션 기반 `signIn("microsoft-entra-id", ...)` 버튼을 AX Auth 로그인 URL로 이동하는 링크로 교체, 환경변수 미설정 시 안내 문구로 대체
- `.env.example`: `AUTH_MICROSOFT_ENTRA_ID_*` 제거, `AX_AUTH_CLIENT_ID`/`AX_AUTH_CLIENT_SECRET`/`AX_AUTH_BASE_URL`/`AX_AUTH_REDIRECT_URI` 추가
- `.claude/launch.json`(신규): 로컬 미리보기용 dev 서버 설정(이번 작업의 스모크 테스트를 위해 추가, `autoPort: true`)
- `docs/product/prd.md`: Phase 1 체크리스트 상태·산출물 갱신
- `docs/tasks/phase-1-ax-auth-login/{spec.md,plan.md,tasks.md,test-result.md,result.md}`(본 문서)

## 핵심 결정

- **리다이렉트 방식 채택**: 백엔드(Next.js Route Handlers)가 있으므로 login-integration-guide.md의 두 방식 중 서버 검증(리다이렉트) 방식을 사용했다. 팝업 방식(`sfood-auth.js` 클라이언트 SDK)은 사용하지 않는다.
- **NextAuth Credentials Provider 활용**: AX Auth는 NextAuth가 지원하는 표준 OAuth Provider가 아니므로, `authorize()`에서 AX Auth의 `/auth/token/verify`를 직접 호출하는 Credentials Provider로 구성했다. 세션 생성은 `signIn("ax-auth", { loginToken, redirectTo: "/editor" })`를 콜백 라우트에서 호출하는 방식으로 트리거한다.
- **콜백 라우트의 성공/실패 처리를 NextAuth에 위임**: `next-auth`(v5 베타) 소스를 확인한 결과, `signIn()`은 성공·실패 여부와 무관하게 항상 `next/navigation`의 `redirect()`를 호출해 예외를 던지는 방식으로 동작한다(내부적으로 `Auth()`가 실패 시 `pages.signIn` 경로로의 리다이렉트 Response를 만들고, `signIn()`이 이를 다시 `redirect()`로 감싼다). 따라서 콜백 라우트에서 별도의 try/catch 성공·실패 분기를 두지 않고, `pages.signIn: "/login"` 설정만으로 실패 시 `/login?error=CredentialsSignin`로 자동 이동하도록 했다. 처음에는 `AuthError`를 catch하는 분기를 작성했으나, 실제로는 도달하지 않는 코드임을 확인하고 제거했다.
- **환경변수 없을 때 페이지 크래시 방지**: `/login` 페이지에서 `getAxAuthLoginUrl()` 호출을 try/catch로 감싸, AX Auth 환경변수가 없을 때도 페이지 전체가 500 에러로 죽지 않고 안내 문구를 보여주도록 했다(Phase 1의 기존 원칙 — 자격증명 없이도 빌드·기본 렌더링은 성공해야 한다 — 를 그대로 따름).

## 검증 결과

`docs/tasks/phase-1-ax-auth-login/test-result.md` 참고. `npm run lint`/`npm run build` 통과, `/login` 페이지와 `/api/auth/ax-callback`(토큰 없는 케이스)을 로컬 dev 서버로 스모크 테스트했다. 실제 AX Auth 자격증명을 이용한 전체 로그인 왕복은 검증하지 못했다(자격증명 부재).

## 열린 과제(Open Gaps)

- **AX Auth 클라이언트 등록**: AX팀에 `clientId`/`redirect_uri`(예: `https://{서비스 도메인}/api/auth/ax-callback`) 등록을 요청해야 실제 로그인이 가능하다.
- **콜백 쿼리 파라미터명 확인 필요**: 현재 코드는 `login_token`과 `loginToken` 두 이름을 모두 시도하지만, 실제 AX Auth가 어떤 이름으로 리다이렉트하는지는 데모 가이드에 명시되어 있지 않아 확인되지 않았다.
- **`/auth/token/verify` 응답 스키마 확인 필요**: 현재 `{ valid, email, reason }` 형태로 추정해 구현했다. 실제 스펙과 다르면 `src/lib/ax-auth/client.ts`의 파싱 로직을 수정해야 한다.
- 위 두 가지가 확인되면 실 자격증명으로 로그인 전체 흐름을 재검증하고, `docs/product/prd.md`의 상태를 "완료"로 갱신해야 한다.
- (참고) `docs/product/prd.md`가 이미 언급한 대로, 댓글 알림 메일 기능(Phase 4)에서 필요한 "댓글 작성 시점의 신선한 `login_token` 확보 방식"은 이번 작업 범위에 포함되지 않으며 여전히 미해결 상태다.

## Next Steps

- 사용자가 AX Auth `clientId`/`clientSecret`/등록된 `redirect_uri`를 준비해 `.env`에 채우면, 실제 로그인 왕복을 재검증할 수 있다.
- Phase 1의 나머지 두 항목(Confluence API 토큰 연결 확인, Slack Webhook 연결 확인)은 이번 작업과 무관하게 여전히 실 자격증명 대기 상태다. 다음으로 이어서 진행할지, 아니면 Phase 2/3/4의 다른 항목으로 넘어갈지 확인이 필요하다.
