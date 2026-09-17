# result — 탭 간 `ax_pending_comment` 쿠키 충돌 완화

## 요약

자체 코드 리뷰 3번 항목을 완화했다. AX Auth는 state/nonce 왕복 파라미터를 지원하지 않아(login-integration-guide.md 확인) 어떤 콜백이 어떤 왕복에 대한 응답인지 서버가 완전히 구분할 방법은 없다 — 그래서 근본적으로 없애는 대신 **가장 심각한 결과(다른 탭의 대기 중인 댓글이 엉뚱한 계정으로 잘못 게시되는 것)를 없애는 데** 집중했다. 평범한 로그인 트리거(게이트 버튼)는 시작 시 남아 있을 수 있는 `ax_pending_comment`를 항상 지운다.

## 변경 파일

- `src/components/comments/CommentSection.tsx` — `startAxAuthLogin`에 `clearPendingComment` 옵션 추가, 게이트 버튼에서만 사용

## 검증

- `npm run lint`/`npm run build` 통과
- 쿠키 삭제 구문(`max-age=0`)이 실제로 쿠키를 제거함을 브라우저 콘솔로 확인
- 게이트 버튼 렌더링 회귀 없음, 댓글 저장 흐름(자신의 초안을 스스로 지우지 않음) 코드 리뷰로 확인
- 상세는 [test-result.md](test-result.md) 참고

## 열린 과제

- **잔여 위험(의도적으로 감수)**: 두 탭이 정확히 동시에 각자의 흐름을 시작하는 진짜 경쟁 상태까지는 막지 못한다 — 그 경우 대기 중이던 댓글이 조용히 유실될 수 있다(엉뚱한 계정으로 게시되지는 않음). 근본 해결은 AX Auth가 state/nonce 파라미터를 지원해야 가능하며, 이는 AX팀과의 연동 계약 변경이 필요해 이 저장소의 범위를 벗어난다.
