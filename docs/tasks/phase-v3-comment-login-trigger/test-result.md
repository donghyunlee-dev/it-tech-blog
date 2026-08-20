# Test Result — Phase V3: 댓글 작성 인라인 로그인 트리거

## 정적 검증

- `npm run lint`: 통과.
- `npm run build`: 통과. 라우트 구성 변화 없음(기존 라우트 그대로).

## 브라우저 검증 (임시 게시 문서로 테스트 후 삭제)

Confluence에 임시 게시 문서(`slug: comment-login-smoke-test`)를 만들어 `/posts/comment-login-smoke-test`에서 확인했다.

1. **버튼 노출**: 로그인하지 않은 상태에서 "MS 계정으로 댓글 작성" 버튼과 "또는 아래에 이름·이메일을 입력해 댓글을 남길 수 있습니다" 안내, 외부 사용자용 이름/이메일 입력란이 모두 정상 노출됨을 확인.
2. **쿠키 저장**: 버튼 클릭 시 `document.cookie`에 `ax_return_to=%2Fposts%2Fcomment-login-smoke-test`(현재 게시글 경로의 URL 인코딩)가 정확히 설정됨을 확인.
3. **AX Auth 리다이렉트**: 버튼 클릭 후 브라우저가 실제로 AX Auth를 거쳐 `https://login.microsoftonline.com`(실제 MS 로그인 화면, 제목 "사용자 계정 로그인")까지 도달함을 확인. 실 자격증명 입력은 진행하지 않고 이전 화면으로 돌아옴(AI가 실 로그인을 대신 완료하지 않는다는 방침).
4. 테스트에 사용한 Confluence 페이지는 확인 후 삭제 완료.

## 미검증 항목

- 실 계정으로 로그인을 끝까지 완료했을 때 콜백(`/api/auth/ax-callback`)이 `ax_return_to` 쿠키를 읽어 정확히 `/posts/comment-login-smoke-test`로 되돌아오는지는 확인하지 못했다(2번까지는 코드/쿠키 레벨로 확인했고, 3번은 AX Auth 쪽 화면 도달까지만 확인 — 그 이후의 콜백 왕복은 실 로그인 완료가 필요해 사용자가 직접 검증해야 한다).
- 로그인 실패 시 `/`(홈)로 `?error=missing_token` 또는 `?error=CredentialsSignin`과 함께 리다이렉트되는 경로는 코드 검토로만 확인했고 실제로 재현하지는 않았다.
