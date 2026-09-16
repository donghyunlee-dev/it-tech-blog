# plan — 댓글 알림 메일용 신선한 login_token 확보

## 접근 방식

기존 `ax_return_to` 쿠키 패턴을 그대로 본떠 `ax_pending_comment` 쿠키를 추가한다. 클라이언트는 MS 로그인 사용자의 댓글 저장을 "즉시 API 호출"에서 "초안을 쿠키에 저장하고 AX Auth로 리다이렉트"로 바꾸고, 서버는 콜백 라우트 한 곳에서 로그인 트리거(기존)와 댓글 완료(신규) 두 가지 경우를 쿠키 유무로 분기한다.

## 영향 범위

- `src/app/api/auth/ax-callback/route.ts`:
  - `readPendingComment(request)`: `ax_pending_comment` 쿠키를 파싱(손상된 값은 무시).
  - `appendError(path, code)`: 기존 `missing_token` 리다이렉트와 신규 분기가 공유하는 헬퍼로 추출.
  - 대기 중인 댓글이 있으면: `verifyLoginToken(loginToken)`으로 이메일을 확보(세션 재생성 없음 — 이미 로그인되어 있었으므로 `signIn()` 호출하지 않음) → `createComment({ session: { email }, ... })` → `getDocumentNotificationMeta` + `notifyCommentAdded`(같은 `loginToken`의 메일 발송 예산 사용) → 쿠키 삭제 후 원래 경로로 리다이렉트. 검증 실패/댓글 생성 실패 시 `comment_failed` 에러 코드로 리다이렉트.
  - 대기 중인 댓글이 없으면 기존 `signIn("ax-auth", ...)` 흐름 그대로.
- `src/components/comments/CommentSection.tsx`:
  - `postComment`: `identity.verified && loginUrl`이면 초안을 쿠키에 담아 `startAxAuthLogin(loginUrl)` 호출 후 반환(직접 POST 생략). 쿠키에 담기엔 너무 크면(약 4KB 초과) 기존처럼 직접 POST(알림 없이).
  - 외부 사용자(`identity.verified === false`) 경로는 변경 없이 직접 POST 유지.
- `src/app/posts/[slug]/page.tsx`: `searchParams`를 받아 `error` 코드가 있으면 댓글 섹션 위에 안내 문구(`.error-text`) 노출. 알려진 코드 2개(`missing_token`/`comment_failed`) 매핑 + 그 외 공용 fallback.
- `src/lib/comments/notify.ts`: 상단 주석의 "확보할 수 있는 UX는 아직 없다" 설명을 실제로 구현된 메커니즘으로 갱신.
- `docs/product/prd.md`: Phase V3 진행 상태 문구에서 "신선한 login_token 확보 UX는 별도 과제로 남아 있다" 문장을 이번 구현으로 대체.

## 왜 signIn()을 다시 호출하지 않는가

`login_token`은 검증(verify) 1회만 허용된다. 대기 중인 댓글 분기에서 이미 `verifyLoginToken`을 직접 호출해 이메일을 확보했으므로, 같은 토큰으로 NextAuth `signIn()`(내부적으로 `authorize()`가 `verifyLoginToken`을 다시 호출)을 또 부르면 `TOKEN_ALREADY_USED`로 실패한다. 사용자는 이 요청을 시작하기 전에 이미 로그인되어 있었으므로(그래서 `identity.verified`가 true였다) 세션을 다시 만들 필요가 없다 — 기존 세션 쿠키는 외부 도메인(AX Auth/Microsoft)을 거쳐 돌아오는 동안에도 그대로 유지된다.

## 검증 전략

1. `npm run lint`, `npm run build`.
2. 코드 레벨 검토: `authorize()`/`completePendingComment` 양쪽 다 `verifyLoginToken`을 최대 1회만 호출하는지 확인(경로가 겹치지 않음을 분기 구조로 보장).
3. 실 브라우저로 로그인 상태에서 댓글을 저장 → AX Auth 왕복 후 댓글이 실제로 등록되는지 확인. 메일 발송 자체(수신 확인)는 사용자가 실제 메일함으로 확인해야 하므로, 서버 로그의 `sendMail` 성공/실패 결과 확인으로 갈음.
4. 쿠키 크기 초과 시나리오(매우 긴 댓글)는 코드 경로 검토로 확인(리다이렉트 없이 즉시 저장되는지).
5. `?error=comment_failed`/`missing_token` 각각 배너 문구 노출 확인.
6. 외부 사용자 댓글 작성, `POST /api/comments` 직접 호출 회귀 없음 확인.

## 리스크

- 사용자의 로컬 Microsoft 세션이 만료되어 있으면 이 왕복이 "무중단"이 아니라 실제 로그인 화면을 보여준다 — 매 댓글 저장마다 발생할 수 있는 마찰이지만, 실패해도 재로그인하면 정상 진행되므로 치명적이지 않다.
- 쿠키 기반 초안 저장은 브라우저 쿠키 차단 설정에서 동작하지 않을 수 있다 — 이미 세션 쿠키에 의존하는 기존 로그인 흐름과 동일한 전제이므로 새로운 리스크는 아니다.
- 댓글 생성이 이제 두 갈래 경로(직접 POST / 콜백 경유)로 나뉘어 유지보수 시 두 곳을 함께 봐야 한다 — 대안(팝업 재인증으로 단일 경로 유지)보다 구현이 단순하다고 판단해 이 트레이드오프를 받아들인다.
