# plan — 댓글 알림 콜백의 실패 원인 구분

## 접근 방식

`completePendingComment`의 단일 try/catch를 두 단계로 나눈다: (1) 인증 실패는 기존과 동일하게 조기 반환, (2) 댓글 생성은 자체 try/catch로 감싸 실패 시 `comment_save_failed`로 리다이렉트, (3) 댓글 생성이 성공한 경우에만 알림 메일을 별도 try/catch로 시도하고, 실패해도 리다이렉트 경로를 바꾸지 않는다(조용히 로그만).

## 영향 범위

- `src/app/api/auth/ax-callback/route.ts`:
  - 인증 실패 시 에러 코드를 `comment_failed` → `comment_auth_failed`로 변경.
  - 댓글 생성 실패 시 에러 코드를 `comment_save_failed`로 신설.
  - 댓글 생성 성공 후 알림 메일 실패는 에러 코드를 붙이지 않고 로그만 남김.
- `src/app/posts/[slug]/page.tsx`: `AUTH_ERROR_MESSAGES`에 `comment_auth_failed`/`comment_save_failed` 두 항목 추가(기존 `comment_failed` 항목은 제거 — 더 이상 발생하지 않음).

## 검증 전략

1. `npm run lint`, `npm run build`.
2. 코드 레벨로 세 갈래(인증 실패/생성 실패/생성 성공+알림 실패)가 각각 의도한 리다이렉트 경로로 가는지 확인.
3. 잘못된 토큰으로 콜백을 호출해 `comment_auth_failed` 확인(이전 태스크의 검증 방식 재사용).
4. `getDocumentNotificationMeta`가 null을 반환하거나 `notifyCommentAdded`가 실패하는 경우를 코드 레벨로 검토해, 리다이렉트 경로에 에러 코드가 붙지 않음을 확인.

## 리스크

- 댓글 생성 성공 후 알림이 실패한 사실 자체를 사용자에게 전혀 알리지 않게 된다 — 기존에도 `notifyCommentAdded`는 "실패해도 댓글 작성 자체를 막지 않는다"는 정책(prd.md 예외 상황)이었으므로, 사용자에게 알리지 않는 것은 기존 정책의 연장이지 새로운 리스크가 아니다. 서버 로그에는 남으므로 운영팀이 확인 가능하다.
