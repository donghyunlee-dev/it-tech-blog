# tasks — 댓글 알림 콜백의 실패 원인 구분

## 구현

- [x] `src/app/api/auth/ax-callback/route.ts`: 인증 실패/댓글 생성 실패/알림 실패를 분리
- [x] `src/app/posts/[slug]/page.tsx`: 에러 코드별 메시지 갱신

## 검증

- [x] `npm run lint`
- [x] `npm run build`
- [x] 잘못된 토큰 → `comment_auth_failed` 확인
- [x] 코드 레벨로 댓글 생성 성공+알림 실패 시 에러 코드 없음 확인

## 문서

- [x] `test-result.md` 작성
- [x] `result.md` 작성
