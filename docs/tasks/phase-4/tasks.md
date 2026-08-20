# Tasks — Phase 4: Comment 기능

## 구현 작업

- [x] `src/lib/confluence/client.ts`에 `createFooterComment`, `listFooterComments` 추가
- [x] `src/lib/ax-auth/client.ts`에 `sendMail` 추가
- [x] `src/lib/comments/structured-body.ts` 작성
- [x] `src/lib/comments/comments.ts` 작성(createComment, listComments)
- [x] `src/lib/comments/notify.ts` 작성(notifyCommentAdded)
- [x] `src/app/api/comments/route.ts` 작성(GET/POST)
- [x] `src/components/comments/CommentSection.tsx` 작성
- [x] `src/app/posts/[slug]/page.tsx`에 Comment 위젯 임베드
- [x] `src/app/globals.css`에 댓글 관련 클래스 추가 — 기존 `card`/`stack`/`doc-list` 클래스로 충분해 신규 클래스는 추가하지 않음

## 테스트 작업

- [x] `npm run lint` 실행 및 결과 기록
- [x] `npm run build` 실행 및 결과 기록
- [x] 로컬 dev 서버로 `/posts/{slug}` 댓글 위젯, `GET/POST /api/comments` 스모크 테스트
- [x] 미검증 항목(실 Confluence/AX Auth 자격증명 필요) 명시

## 문서화 작업

- [x] `docs/product/prd.md` Phase 4 체크리스트 상태·산출물 갱신
- [x] `docs/tasks/phase-4/test-result.md` 작성
- [x] `docs/tasks/phase-4/result.md` 작성

## 진행 상태

모든 항목 완료. 단, Confluence/AX Auth 실 자격증명 부재로 실제 댓글 작성·조회·알림 메일 발송 검증은 이번 범위에서 제외(test-result.md의 "미검증 항목" 참고). 댓글 알림 메일의 신선한 login_token 확보 UX는 별도 후속 작업으로 남음.
