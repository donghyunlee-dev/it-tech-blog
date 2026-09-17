# spec — 댓글 알림 콜백의 실패 원인 구분

## 문제 정의

자체 코드 리뷰(2026-09-17, `docs/product/prd.md` "코드 품질 자체 점검" 참고)에서 확인된 2번 항목. `src/app/api/auth/ax-callback/route.ts`의 `completePendingComment`는 `login_token` 검증 성공 이후 댓글 생성(`createComment`), 알림 메일 발송(`notifyCommentAdded`)까지 하나의 `try/catch`로 묶어, 무엇이 실패했든 전부 `comment_failed` 코드로 리다이렉트한다. `src/app/posts/[slug]/page.tsx`는 이 코드를 항상 "댓글 인증에 실패해 작성 중이던 내용이 저장되지 않았습니다"로 안내한다.

두 가지 실제 문제:
1. 인증(verify)은 이미 성공한 뒤인데도, 그 이후 실패(검증 오류, 부모 댓글 삭제, Confluence 장애)를 전부 "인증 실패"로 잘못 안내한다.
2. 더 심각하게는, 댓글 생성 자체는 성공했는데 그 다음 알림 메일 발송만 실패해도 같은 catch에 걸려 "저장되지 않았습니다"로 안내된다 — 사용자가 이를 믿고 다시 입력해 제출하면 댓글이 중복 생성될 수 있다.

## 범위 (In Scope)

- `completePendingComment`에서 "댓글 생성"과 "알림 메일 발송"의 실패를 서로 다른 `try/catch`로 분리한다.
- 댓글 생성이 성공한 뒤에는 알림 메일이 실패해도 사용자에게 실패로 보이지 않게 한다(조용히 로그만 남김 — 기존에 `notifyCommentAdded` 자체가 이미 예외를 던지지 않는 정책과 일관됨).
- 인증 실패(`verifyLoginToken` 실패)와 댓글 저장 실패(`createComment` 예외)를 서로 다른 에러 코드로 구분해, 사용자에게 실제 원인에 가까운 안내를 보여준다.

## Out of Scope

- `createComment`가 던지는 개별 에러 타입(ValidationError/NotFoundError/기타)별로 세분화된 메시지를 만드는 것 — 이번에는 "인증 실패" vs "저장 실패" 두 갈래만 구분한다(development-rules.md의 "최소 효과적인 구현" 원칙).
- rate limiting 관련 항목(1번) — 자체 코드 리뷰 재검증 결과 실제로는 문제가 아님을 확인해 prd.md에 정정 기록했다(Vercel이 프록시 없는 직접 배포에서 `X-Forwarded-For`를 항상 실제 IP로 덮어써 스푸핑이 불가능함 — https://vercel.com/docs/headers/request-headers).

## 수용 기준

- [ ] 댓글 생성 자체가 성공하면, 이후 알림 메일 발송이 실패해도 사용자는 실패 안내를 보지 않는다(정상적으로 돌아간 게시글에서 댓글이 실제로 보인다).
- [ ] `verifyLoginToken` 실패와 `createComment` 실패가 서로 다른 에러 코드로 리다이렉트되고, 각각 다른 안내 문구가 표시된다.
- [ ] `npm run lint`/`npm run build` 통과.
