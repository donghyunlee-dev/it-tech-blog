# spec — 댓글 로그인 UX 단순화 (게이트 1버튼 + MS 실패 시 게스트 전환)

## 문제 정의

1. 댓글 게이트 화면에 "MS 계정으로 인증 (사내 직원)"/"이름으로 계속하기 (외부 방문자)" 두 버튼이 그대로 노출되어, 공개 방문자에게 불필요한 사내 구분 용어가 보인다.
2. MS 로그인이 실패하거나(토큰 만료 등) 사내 계정이 아니어서 인증에 실패하면, NextAuth의 `pages.signIn: "/"` 설정 때문에 방문자가 홈으로 튕겨나가고 일반적인 로그인 오류로 취급된다. 원래 보던 글로 돌아오지도 못하고, "실패"라는 인상만 남는다.
3. 신원 확인(게이트→확인 카드→작성창) 3단계가 분리되어 있어 화면 전환이 많다.

## 설계 변경

- 게이트에는 **"로그인" 버튼 하나만** 남긴다. 클릭하면 기존과 동일하게 AX Auth 리다이렉트를 시작한다.
- AX Auth가 성공하면(세션 생성됨) 이메일이 고정된 채 이름(선택)+댓글 작성 화면으로 바로 넘어간다.
- AX Auth가 실패하면(로그인 자체 실패, 토큰 만료, 사내 계정 아님 등) **오류 화면이 아니라** 이름·이메일을 직접 입력하는 동일한 작성 화면으로 넘어간다.
- "확인" 단계를 없애고, 이메일 라벨+입력, 이름 라벨+입력을 화면 위에, 댓글 textarea를 그 아래에 배치한 단일 작성 화면으로 합친다.
  - MS 인증 성공: 이메일 입력은 세션 값으로 채워지고 수정 불가(잠금). 이름은 이메일 앞부분이 기본값으로 채워지되 수정 가능하고, 비워도 된다(제출 시 기본값으로 대체).
  - 게스트: 이메일·이름 모두 비어 있고 수정 가능하며 필수(제출 시 서버가 검증).
- 화면/코드 어디에도 "사내 직원"/"외부 방문자"/"관리자"/"일반" 같은 구분 문구를 노출하지 않는다. 내부 데이터 모델(`authorType: ms_user | external`)은 그대로 유지한다(서버 로직·data-spec.md 변경 없음).

## 범위 (In Scope)

1. `src/components/comments/CommentSection.tsx`: 3단계(gate/ms-confirm/guest-confirm/composer) → 2단계(gate/compose)로 재구성. 이메일·이름 입력을 댓글 textarea 위에 배치.
2. `src/lib/auth.ts`: `pages.signIn`을 `/api/auth/ax-signin-failed`로 변경.
3. 신규 `src/app/api/auth/ax-signin-failed/route.ts`: NextAuth 로그인 실패 시 원래 글로 돌아가면서 게스트 모드로 전환하는 쿼리(`?comment=guest`)를 붙인다.
4. `src/app/api/auth/ax-callback/route.ts`: `login_token`이 아예 없고 대기 중인 댓글도 없는 경우(순수 로그인 트리거 실패) `missing_token` 에러 대신 `?comment=guest`로 리다이렉트. 대기 중인 댓글이 있는 경우(이미 작성된 댓글을 저장하려던 왕복)는 기존처럼 에러로 유지한다 — 이미 타이핑한 댓글 손실을 조용히 게스트 전환으로 덮지 않기 위해서다.
5. `src/app/posts/[slug]/page.tsx`: `searchParams`에 `comment` 추가, `CommentSection`에 `startAsGuest` prop으로 전달.
6. `src/app/globals.css`: 3단계 시절 클래스(`.identify-panel`, `.identity-verified-tag` 등) 중 안 쓰게 된 것 정리, 새 통합 입력 필드 스타일 추가.
7. `docs/guide/design-direction.md`의 "댓글 작성 프로세스" 절을 새 흐름으로 갱신(날짜 붙여 기록).

## Out of Scope

- `src/lib/comments/comments.ts`, `src/app/api/comments/route.ts`의 서버 검증 로직(이메일 형식 검사, `authorType` 판정 등) — 그대로 유지.
- 댓글 저장 시 알림 메일을 위해 다시 AX Auth를 타는 "pending comment" 왕복 메커니즘 자체 — 그대로 유지.
- `viewer-pending-comment-crosstab`의 잔여 위험(진짜 동시 탭 경쟁 상태) — 이번 변경과 무관, 손대지 않음.

## 수용 기준

- [x] 댓글 영역에 "사내 직원"/"외부 방문자" 등 구분 문구가 화면 어디에도 보이지 않는다.
- [x] 게이트에 버튼이 "로그인" 하나만 있다.
- [ ] 로그인 성공(세션 있음) 시 이메일 잠금 + 이름(선택) + textarea가 한 화면에 보인다. — 코드 리뷰로 확인, 실 MS 계정 로그인은 미실측(test-result.md 참고)
- [x] 로그인 실패(NextAuth `pages.signIn` 경로) 시 홈으로 이동하지 않고 원래 글로 돌아와 이메일·이름 입력 가능한 동일 화면으로 전환된다.
- [x] 게스트로 이름·이메일·본문을 입력해 실제로 댓글이 저장되고 목록에 나타난다(엔드투엔드 확인).
- [x] `npm run lint`/`npm run build` 통과.
