# tasks — 탭 간 `ax_pending_comment` 쿠키 충돌 완화

## 구현

- [x] `src/components/comments/CommentSection.tsx`: `startAxAuthLogin`에 `clearPendingComment` 옵션 추가, 게이트 버튼에서 사용

## 검증

- [x] `npm run lint`
- [x] `npm run build`
- [x] 게이트 버튼 클릭 시 대기 댓글 쿠키가 지워지는지 확인(쿠키 저장소 동작 검증)
- [x] 댓글 저장 흐름 회귀 없음 확인

## 문서

- [x] `test-result.md` 작성
- [x] `result.md` 작성
