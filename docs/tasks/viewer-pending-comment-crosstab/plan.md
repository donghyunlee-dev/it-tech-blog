# plan — 탭 간 `ax_pending_comment` 쿠키 충돌 완화

## 접근 방식

`startAxAuthLogin`(CommentSection.tsx)에 선택적 `clearPendingComment` 옵션을 추가한다. 게이트 버튼(평범한 로그인 트리거) 호출부만 이 옵션을 켜서, 자신이 시작하는 로그인 왕복이 다른 탭의 대기 중인 댓글 초안을 우연히 소비하지 않도록 만든다. `postComment`의 리다이렉트 분기는 `storePendingComment`가 자신의 새 초안으로 같은 쿠키를 덮어쓰므로 변경하지 않는다.

## 영향 범위

- `src/components/comments/CommentSection.tsx`:
  - `startAxAuthLogin(loginUrl, options?)`: `options.clearPendingComment`가 true면 `ax_pending_comment` 쿠키를 즉시 만료시켜 삭제.
  - 게이트 버튼의 `onClick`에서 `startAxAuthLogin(loginUrl, { clearPendingComment: true })` 호출.

## 검증 전략

1. `npm run lint`, `npm run build`.
2. 코드 레벨로 게이트 버튼 클릭 시 두 쿠키 쓰기(반환 경로 저장 + 대기 댓글 삭제)가 모두 일어나는 순서를 확인(삭제가 리다이렉트보다 먼저 실행되어야 함).
3. 브라우저에서 댓글 저장 버튼(대기 댓글 쿠키 설정 경로)이 기존과 동일하게 동작하는지(회귀 없음) 확인.

## 리스크

- 이 수정은 "두 탭이 정확히 동시에" 각각의 흐름을 시작하는 진짜 경쟁 상태까지 막지는 못한다 — 그 경우 여전히 어느 한쪽의 대기 중인 댓글이 조용히 사라질 수 있다. 다만 spec.md에서 명시했듯, 이번 수정 이전처럼 "엉뚱한 계정으로 잘못 게시됨"이라는 더 심각한 결과는 발생하지 않는다.
