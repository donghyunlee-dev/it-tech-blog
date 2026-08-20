# Result — Phase V3: 댓글 작성 인라인 로그인 트리거

## 배달된 범위

prd.md 화면 정의에 있던 "MS 계정으로 댓글 작성" 버튼(로그인 트리거)을 구현했다. 겸사겸사, 저장소 분리 이후 깨져 있던 로그인 콜백 리다이렉트 경로(`/editor`, `/login` 하드코딩)도 함께 고쳤다.

## 변경 파일

- `src/lib/auth.ts`: `pages.signIn`을 `/login`(삭제됨) → `/`로 변경
- `src/app/api/auth/ax-callback/route.ts`: `ax_return_to` 쿠키 기반으로 로그인 성공/실패 시 원래 보던 게시글로 되돌아오도록 재작성
- `src/app/posts/[slug]/page.tsx`: `getAxAuthLoginUrl()`로 로그인 URL 계산, `CommentSection`에 전달
- `src/components/comments/CommentSection.tsx`: 로그인 트리거 버튼, `startAxAuthLogin` 쿠키 저장 로직, `loginUrl` prop 스레딩

## 핵심 결정

- **돌아갈 위치는 AX Auth가 아니라 우리 쿠키로 관리**: AX Auth의 로그인 시작 엔드포인트가 임의 상태값을 그대로 왕복시켜 준다는 보장이 문서에 없어, 클라이언트가 로그인 직전에 직접 쿠키(`ax_return_to`)에 현재 경로를 저장하고 콜백이 그걸 읽는 방식을 택했다. AX Auth의 미확인 동작에 기대지 않는 가장 안전한 설계다.
- **오픈 리다이렉트 방지**: 콜백은 쿠키 값이 `/`로 시작하고 `//`로 시작하지 않는 경우에만 신뢰하고, 그 외에는 홈으로 fallback한다.
- **버튼과 외부 사용자 폼을 함께 노출**: 로그인 트리거 버튼 아래에 여전히 이름/이메일 입력 폼을 유지해, 두 댓글 작성 방식(MS 로그인 사용자 / 외부 사용자)을 사용자가 직접 선택할 수 있게 했다.

## 검증 결과

`docs/tasks/phase-v3-comment-login-trigger/test-result.md` 참고. lint/build 통과. 임시 게시 문서로 버튼 노출, 쿠키 저장, AX Auth 리다이렉트(실 MS 로그인 화면 도달)까지 확인 후 테스트 데이터 정리 완료.

## 열린 과제(Open Gaps)

- 실 로그인 완료 후 콜백이 정확한 게시글로 돌아오는 전체 왕복은 사용자가 직접 검증해야 한다(실 자격증명 입력은 AI가 대신하지 않음).
- 댓글 알림 메일 발송용 신선한 `login_token` 확보 UX는 여전히 별도 과제로 남아 있다 — 이 로그인 트리거는 NextAuth 세션 생성이 목적이고, 세션 생성에 쓰인 토큰은 검증 시점에 이미 소비되어 메일 발송에 재사용할 수 없다.
- 로그인 실패 시 홈으로 리다이렉트되지만, 홈 화면에 에러 메시지를 보여주는 UI는 만들지 않았다(쿼리 파라미터 `?error=...`만 붙는다) — 필요하면 후속 작업으로 추가한다.

## Next Steps

- 사용자가 실 계정으로 전체 로그인→댓글 작성→알림 메일 흐름을 직접 검증.
- Editor 배포 파이프라인 구성, AX Auth clientId 서비스별 분리 등록 등 기존에 열려 있던 이관 후속 작업 진행.
