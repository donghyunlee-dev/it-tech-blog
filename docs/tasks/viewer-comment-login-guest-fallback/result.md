# result — 댓글 로그인 UX 단순화 (게이트 1버튼 + MS 실패 시 게스트 전환)

## 요약

댓글 게이트에서 "MS 계정으로 인증 (사내 직원)"/"이름으로 계속하기 (외부 방문자)" 2버튼과 별도 "확인" 단계를 없애고, "로그인" 버튼 하나 → 이메일/이름+댓글 통합 작성 화면 두 단계로 단순화했다. MS 로그인이 실패해도 오류 화면이 아니라 같은 작성 화면(이메일·이름 직접 입력)으로 자연스럽게 넘어가도록 `pages.signIn`과 `ax-callback` 콜백의 실패 분기를 바꿨다. 실제 게시글에 게스트 댓글을 남겨 저장까지 확인했고, 그 과정에서 발견한 별도의 잠복 버그(`createdAt` 필드 오매핑으로 댓글 2개 이상일 때 목록 조회가 죽는 문제)도 함께 고쳤다.

## 변경 파일

- `src/components/comments/CommentSection.tsx` — 3단계(gate/ms-confirm/guest-confirm/composer) → 2단계(gate/compose)로 재작성. 이메일·이름 입력이 채워져야만 댓글 textarea가 나타난다.
- `src/lib/auth.ts` — `pages.signIn`을 `/api/auth/ax-signin-failed`로 변경.
- `src/app/api/auth/ax-signin-failed/route.ts` — 신규. 로그인 실패 시 원래 글로 게스트 모드(`?comment=guest`)로 돌려보낸다.
- `src/app/api/auth/ax-callback/route.ts` — `login_token`이 없고 대기 중인 댓글도 없는 순수 로그인 트리거 실패를 게스트 전환으로 처리(대기 중인 댓글이 있는 경우는 기존처럼 에러 유지).
- `src/lib/ax-auth/return-to.ts` — 신규. 두 라우트가 공유하는 `ax_return_to` 쿠키 해석 로직을 추출.
- `src/app/posts/[slug]/page.tsx` — `searchParams.comment`를 읽어 `CommentSection`에 `startAsGuest`로 전달.
- `src/app/globals.css` — 3단계 시절 클래스(`.identify-panel`, `.identity-verified-tag`, `.identity-confirmed-bar`, `.panel-label`, `.composer-footer`) 제거, 통합 입력 필드 스타일(`.comment-identity-fields` 등) 추가.
- `docs/guide/design-direction.md` — "댓글 작성 프로세스" 절에 2026-09-18 수정 내용 추가.
- **범위 밖에서 발견해 함께 수정**: `src/lib/confluence/client.ts`(`ConfluenceFooterComment.createdAt` → `version.createdAt`), `src/lib/comments/comments.ts`(관련 3곳 접근 수정) — 댓글이 2개 이상인 글에서 목록 조회가 항상 실패하던 잠복 버그.

## 검증

- `npm run lint`/`npm run build` 통과
- 실제 게시글에 게스트 신원(이메일·이름 직접 입력)으로 댓글 작성 → 저장 → 새로고침 후 목록 표시까지 엔드투엔드 확인
- MS 로그인 실패 시 게스트 화면으로 전환되는 리다이렉트(`ax-signin-failed`)를 직접 호출로 재현·확인
- 상세는 [test-result.md](test-result.md) 참고

## 추가 변경 (2026-09-18, 같은 작업 범위 내)

Google 로그인 추가를 검토했으나, AX Auth(MS)는 "사내 직원 확인"이라 Google과 신뢰 등급이 달라 동급 SSO로 두기 어렵다는 결론에 따라 보류했다. 대신 사용자 제안으로 **게이트에 "비로그인" 버튼을 추가**했다 — MS 로그인 실패 시 도달하는 것과 동일한 화면(이메일·이름 직접 입력)으로, AX Auth 왕복 없이 바로 진입한다. MS 로그인 프로세스는 변경하지 않았다.

- 변경 파일: `src/components/comments/CommentSection.tsx`(게이트에 버튼 추가), `docs/guide/design-direction.md`
- 검증: 실제 게시글에서 "비로그인" 클릭 → 리다이렉트 없이 이메일/이름 입력 화면 즉시 전환 확인, `npm run lint`/`npm run build` 통과

## 열린 과제

- **MS 로그인 성공 경로 실측 불가**: 이 환경에 실제 사내 Microsoft 계정이 없어 로그인 성공 후 이메일 잠금 UI가 실제로 뜨는지는 코드 리뷰로만 확인했다. 실 계정으로 한 번 확인이 필요하다.
- 로컬 `.env`의 `AX_AUTH_REDIRECT_URI`가 `localhost:3000` 고정인데 개발 중 다른 포트로 뜨면 AX Auth가 `INVALID_REDIRECT_URI`를 반환한다 — 이번 작업과 무관한 로컬 환경 이슈이며, 운영 배포에는 영향 없다.
