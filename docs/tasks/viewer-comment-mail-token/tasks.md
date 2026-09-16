# tasks — 댓글 알림 메일용 신선한 login_token 확보

## 구현

- [x] `src/app/api/auth/ax-callback/route.ts`: `appendError` 헬퍼 추출, `readPendingComment` 추가, 대기 중인 댓글 완료 분기(`completePendingComment`) 추가
- [x] `src/components/comments/CommentSection.tsx`: MS 로그인 사용자 댓글 저장 시 쿠키 저장 + 리다이렉트로 변경(크기 초과 시 기존 직접 POST로 폴백)
- [x] `src/app/posts/[slug]/page.tsx`: `?error=` 안내 배너 추가
- [x] `src/lib/comments/notify.ts`: 주석 갱신
- [x] `docs/product/prd.md`: Phase V3 진행 상태 갱신

## 검증

- [x] `npm run lint`
- [x] `npm run build`
- [x] 잘못된 토큰 경로(comment_failed) 확인
- [x] 기존 로그인 트리거 흐름 회귀 없음 확인
- [x] `?error=` 배너 노출 확인
- [x] 브라우저 렌더링(콘솔 에러 없음) 확인
- [ ] 실 계정 해피 패스(로그인→댓글 저장→메일 수신) — 사용자 직접 검증 필요(열린 과제로 이관)

## 문서

- [x] `test-result.md` 작성
- [x] `result.md` 작성
