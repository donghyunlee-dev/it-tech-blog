# 🔐 로그인 연동 가이드 (AX Auth)

> 출처: [https://ax-auth.s-food.ai/demo/guide](https://ax-auth.s-food.ai/demo/guide) (사내 AX팀 제공 데모 가이드, 2026-08-18 확인)

## 개요

AX Auth는 사내 공통 로그인 인증 서비스로, 개별 서비스가 Microsoft Entra ID(Azure AD)와 직접 OIDC 연동을 구성하지 않고도 AX Auth가 대행하는 로그인 절차를 통해 사용자 인증 결과(`login_token`)를 전달받는 방식이다. 서비스는 팝업 방식 또는 리다이렉트 방식 중 하나를 선택해 연동한다.

- 관련 문서: [prd.md](prd.md), [architecture.md](architecture.md)

## 사전 준비 — 클라이언트 등록

연동 전 AX팀에 다음 정보를 전달해 `clientId`를 등록해야 한다.

| 항목 | 설명 |
|---|---|
| `clientId` | 서비스가 원하는 값 (영문 소문자 + 하이픈) |
| `redirect_uri` | 본인 서비스의 콜백 URL (AX팀에 사전 등록 필요) |

데모 페이지는 고정 샘플 클라이언트(`ax-auth-sample`)로 동작하며, 실제 서비스 연동 시에는 별도로 발급받은 `clientId`와 등록된 `redirect_uri`를 사용해야 한다.

## 연동 방식

### 방식 1 — 팝업 방식 (프런트엔드 전용, `clientSecret`불필요)

프런트엔드에서 팝업으로 로그인을 띄우고, 발급받은 `login_token`을 AX Auth의 릴레이 검증 엔드포인트로 바로 검증한다. 서버에 `clientSecret`을 두지 않아도 되므로 백엔드가 없는 서비스에 적합하다.

```html
<script src="https://ax-auth.s-food.ai/sfood-auth.js"></script>
<script>
  const auth = new SfoodAuth({
    clientId: '등록한-clientId',
    authBaseUrl: 'https://ax-auth.s-food.ai',
    redirectUri: '내-서비스-콜백-URL'
  });

  auth.loginWithPopup()
    .then(({ loginToken }) => auth.verifyViaRelay(loginToken))
    .then(({ valid, email }) => {
      if (valid) console.log('로그인 성공:', email);
    });
</script>
```

### 방식 2 — 리다이렉트 방식 (백엔드 서버 검증)

백엔드가 있는 서비스는 콜백으로 전달받은 `login_token`을 서버에서 `clientSecret`과 함께 직접 검증한다.

```http
POST https://ax-auth.s-food.ai/auth/token/verify
Content-Type: application/json

{
  "clientId": "등록한-clientId",
  "clientSecret": "발급받은-시크릿",
  "loginToken": "콜백에서-받은-토큰"
}
```

## 엔드포인트 요약

| Method | 경로 | 용도 | 인증 주체 |
|---|---|---|---|
| GET | `/auth/login/{clientId}` | 로그인 시작(Microsoft 인가 요청 위임) | 사용자 브라우저 |
| POST | `/auth/token/verify-relay` | `login_token` 릴레이 검증 (팝업 방식, `clientSecret` 불필요) | 프런트엔드 |
| POST | `/auth/token/verify` | `login_token` 서버 검증 (리다이렉트 방식, `clientSecret` 필요) | 백엔드 서버 |

## 토큰 정책

- `login_token`은 발급 후 **180초(TTL)** 이내에만 유효하다.
- `login_token`은 **1회용**이며, 검증에 사용되는 즉시 소비된다.

## 에러 코드

토큰 직접 검증 테스트 화면에서 재현 가능한 실패 케이스는 다음과 같다.

| 코드 | 의미 |
|---|---|
| `TOKEN_EXPIRED` | 발급 후 180초(TTL) 초과 |
| `TOKEN_ALREADY_USED` | 이미 검증에 사용된 토큰(1회용 정책 위반) |
| `TOKEN_NOT_FOUND` | 서버 DB에 존재하지 않는 토큰 |

## 보안 유의사항

- `clientId`/`clientSecret`은 소스 코드에 하드코딩하지 않고 서버 환경변수/시크릿 매니저로만 관리한다.
- `clientSecret`을 사용하는 `/auth/token/verify` 호출은 반드시 서버 간 호출로만 수행하며, 브라우저에서 직접 호출하지 않는다.
- `redirect_uri`는 AX팀에 등록된 신뢰 가능한 도메인만 사용한다.

## SFOOD IT Tech Blog 적용 시 참고 사항

서비스는 Azure AD와 직접 OIDC 연동을 구성하지 않고, 본 문서의 AX Auth 경유 방식을 채택한다. AX Auth가 Azure AD 로그인을 대행하며, 우리 서비스는 그 결과(`login_token`)를 검증해 세션을 생성한다.

Next.js Route Handlers 기반 백엔드가 있으므로 **방식 2 — 리다이렉트 방식**을 사용한다. 콜백으로 전달받은 `login_token`을 서버에서 `clientSecret`과 함께 `/auth/token/verify`로 검증한 뒤, 그 결과로 Auth.js(NextAuth) 세션을 생성한다.

이 결정에 따라 기존에 Azure AD 직접 OIDC 연동으로 구현되어 있던 로그인 코드(`src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`)는 AX Auth 리다이렉트 방식에 맞춰 재구현이 필요하다. 관련 내용은 [prd.md](prd.md)의 Phase 1 체크리스트와 [architecture.md](architecture.md)의 인증 방식 항목에 반영되어 있다.
