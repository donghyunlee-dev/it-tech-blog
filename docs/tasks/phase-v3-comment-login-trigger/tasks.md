# Tasks — Phase V3: 댓글 작성 인라인 로그인 트리거

## 구현 작업

- [x] `src/lib/auth.ts` `pages.signIn`을 `/`로 변경
- [x] `src/app/api/auth/ax-callback/route.ts` 재작성(쿠키 기반 returnTo, `/editor` 하드코딩 제거)
- [x] `src/app/posts/[slug]/page.tsx`에서 `loginUrl` 계산 및 전달
- [x] `src/components/comments/CommentSection.tsx`에 로그인 트리거 버튼 및 쿠키 저장 로직 추가

## 테스트 작업

- [x] `npm run lint`
- [x] `npm run build`
- [x] 임시 게시 문서로 브라우저 확인: 버튼 노출, 클릭 시 `ax_return_to` 쿠키 값 확인, AX Auth 경유 `login.microsoftonline.com` 도달 확인
- [x] 테스트 문서 정리(삭제)

## 문서화 작업

- [x] `docs/product/prd.md` Phase V3 상태 갱신
- [x] `docs/tasks/phase-v3-comment-login-trigger/{spec.md,plan.md,tasks.md,test-result.md,result.md}` 작성

## 진행 상태

버튼 구현 및 AX Auth 리다이렉트 도달까지 확인 완료. 실 로그인 완료 후 정확한 게시글로 돌아오는지, 댓글 알림 메일용 신선한 login_token 확보는 별도 과제로 남음.
