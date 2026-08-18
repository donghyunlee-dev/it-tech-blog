# Test Result — Phase 1: AX Auth 경유 로그인 재구현

## 실행한 검증

| 명령/시나리오 | 결과 | 비고 |
|---|---|---|
| `npm run lint` | 통과 | 경고·오류 없음 |
| `npm run build` | 통과 | `GET /api/auth/ax-callback`가 라우트로 정상 등록됨(`Route (app)` 목록에 표시) |
| `/login` 페이지 렌더링(AX Auth 환경변수 미설정 상태) | 통과 | 크래시 없이 "AX Auth 연동 환경변수가 설정되지 않아 로그인을 시작할 수 없습니다" 안내 노출(`getAxAuthLoginUrl()` 실패를 페이지에서 흡수) |
| `GET /api/auth/ax-callback`(쿼리 파라미터 없이 호출) | 통과 | `/login?error=missing_token`으로 리다이렉트, `/login`에 "로그인에 실패했습니다" 문구 노출 확인 |

렌더링·콜백 라우트 확인은 `npm run dev`로 로컬 서버를 띄운 뒤 브라우저로 직접 접속해 수행했다.

## 미검증 항목(실 AX Auth 자격증명 필요)

- 실제 `AX_AUTH_CLIENT_ID`/`AX_AUTH_CLIENT_SECRET`/`AX_AUTH_REDIRECT_URI`가 없어 다음은 검증하지 못했다.
  - `/login` → AX Auth 로그인 화면 → 콜백 → 세션 생성 → `/editor` 진입까지의 전체 왕복
  - `login_token`이 유효한 경우 `verifyLoginToken()`이 실제로 `{ valid: true, email }`을 반환하는지(응답 스키마는 추정치, spec.md의 "가정 및 미확인 사항" 참고)
  - 콜백 쿼리 파라미터명이 실제로 `login_token`(또는 `loginToken`)이 맞는지
  - `TOKEN_EXPIRED`/`TOKEN_ALREADY_USED`/`TOKEN_NOT_FOUND` 각 실패 케이스의 실제 응답 처리

## 참고(이번 변경과 무관한 기존 조건)

- 로컬 테스트 환경에 `AUTH_SECRET`을 포함한 `.env`가 없어 `[auth][error] MissingSecret` 로그가 남았다. 이는 AX Auth 전환과 무관하게 Phase 1부터 존재하던 조건(자격증명 미설정)이며, 실제 배포/로컬 개발 시 `.env`에 값을 채우면 해소된다.
