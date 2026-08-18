# Plan — Phase 1: AX Auth 경유 로그인 재구현

## 영향 범위

- `src/lib/auth.ts` (교체)
- `src/lib/ax-auth/client.ts` (신규)
- `src/app/api/auth/ax-callback/route.ts` (신규)
- `src/app/login/page.tsx` (수정)
- `.env.example` (수정)
- `docs/product/prd.md` (Phase 1 체크리스트 갱신)
- `docs/tasks/phase-1-ax-auth-login/{test-result.md,result.md}` (신규)

`src/lib/auth-guard.ts`, `/api/editor/*` 등 세션의 `email`만 참조하는 기존 코드는 수정하지 않는다(provider 교체와 무관하게 동일 인터페이스 유지).

## 기술적 접근

1. **`src/lib/ax-auth/client.ts`**
   - `getAxAuthLoginUrl()`: `${AX_AUTH_BASE_URL}/auth/login/${AX_AUTH_CLIENT_ID}?redirect_uri=<AX_AUTH_REDIRECT_URI>` 형태의 URL을 생성한다.
   - `verifyLoginToken(loginToken)`: `POST {AX_AUTH_BASE_URL}/auth/token/verify`를 `clientId`/`clientSecret`/`loginToken`과 함께 호출하고 `{ valid, email, reason }` 형태로 결과를 정규화해 반환한다. 네트워크 오류도 `{ valid: false, reason: "..." }`로 흡수한다(호출부에서 예외를 직접 다루지 않도록).

2. **`src/lib/auth.ts`**
   - `next-auth/providers/microsoft-entra-id` 제거.
   - `next-auth/providers/credentials`로 `id: "ax-auth"` Provider를 등록하고, `authorize({ loginToken })`에서 `verifyLoginToken`을 호출해 유효하면 `{ id: email, email, name: email }`을, 아니면 `null`을 반환한다.

3. **`src/app/api/auth/ax-callback/route.ts`**
   - `GET` 핸들러에서 `request.nextUrl.searchParams`로부터 `login_token` 또는 `loginToken` 값을 읽는다.
   - 값이 없으면 `/login?error=missing_token`으로 리다이렉트.
   - 있으면 `signIn("ax-auth", { loginToken, redirectTo: "/editor" })`를 호출한다. NextAuth v5의 `signIn()`은 성공 시 `next/navigation`의 `redirect()`를 내부적으로 던져 실제 리다이렉트를 수행하므로, 이 예외는 그대로 다시 던져야 한다(`digest`가 `NEXT_REDIRECT`로 시작하는지로 구분). 자격증명 검증 실패(`AuthError`/`CredentialsSignin`)는 별도로 잡아 `/login?error=invalid_token`으로 리다이렉트한다.

4. **`src/app/login/page.tsx`**
   - 기존 `signIn("microsoft-entra-id", ...)` 서버 액션 버튼을 제거한다.
   - AX Auth는 NextAuth가 관리하는 OAuth Provider가 아니라 외부 리다이렉트 대상이므로, `getAxAuthLoginUrl()`이 반환하는 URL로 이동하는 일반 `<a>` 링크로 교체한다(자바스크립트 없이도 동작).

5. **`.env.example`**
   - `AUTH_MICROSOFT_ENTRA_ID_ID`/`_SECRET`/`_ISSUER` 제거.
   - `AX_AUTH_BASE_URL`(기본값 `https://ax-auth.s-food.ai`), `AX_AUTH_CLIENT_ID`, `AX_AUTH_CLIENT_SECRET`, `AX_AUTH_REDIRECT_URI` 추가.
   - `AUTH_SECRET`은 그대로 유지(NextAuth 세션 암호화용, provider와 무관).

## 검증 전략

- `npm run lint`, `npm run build`를 자격증명 없이 실행해 통과 여부 확인(Phase 1 스캐폴딩 때와 동일 기준).
- 실제 AX Auth `clientId`/`clientSecret`이 없어 `/api/auth/ax-callback`과 로그인 화면의 실제 리다이렉트 왕복은 라이브로 검증할 수 없다 — 이는 test-result.md에 미검증 항목으로 명시한다.

## 리스크

- 콜백 쿼리 파라미터명과 `/auth/token/verify` 응답 스키마가 가정에 근거하고 있어, 실제 AX Auth 전체 연동 가이드와 다를 경우 콜백 라우트 수정이 필요할 수 있다(spec.md의 "가정 및 미확인 사항" 참고).
- NextAuth v5 베타의 `signIn()` 리다이렉트-예외 처리 방식은 실제 요청으로 검증되지 않았다. 타입 체크와 빌드는 통과하더라도 런타임 동작은 실 자격증명 확보 후 재검증이 필요하다.
