# test-result — 탭 간 `ax_pending_comment` 쿠키 충돌 완화

| 항목 | 방법 | 결과 |
|---|---|---|
| Lint | `npm run lint` | 통과 |
| 빌드 | `rm -rf .next && npm run build` | 통과 |
| 쿠키 삭제 동작 | 브라우저 콘솔에서 `ax_pending_comment` 쿠키를 미리 심어둔 뒤, `startAxAuthLogin`의 삭제 구문(`max-age=0`)과 동일한 구문을 실행 | 실행 전 `document.cookie`에 쿠키 존재 확인, 실행 후 완전히 제거됨(빈 문자열)을 확인 — 실제 함수는 컴포넌트 클로저 내부라 직접 호출할 수 없어 소스와 동일한 구문으로 쿠키 저장소 동작 자체를 검증 |
| 게이트 버튼 렌더링 | 브라우저(dev)로 실 게시 문서 접속, "MS 계정으로 인증" 버튼 확인 | 콘솔 에러 없이 정상 렌더링됨(회귀 없음) |
| 댓글 저장 흐름(`postComment`) 회귀 | 코드 리뷰 | `startAxAuthLogin(loginUrl)`(옵션 없음) 호출은 그대로 유지되어 `clearPendingComment`가 기본적으로 동작하지 않음 — 방금 `storePendingComment`가 설정한 자신의 초안을 스스로 지우는 일이 없음을 확인 |

## 커버되지 않은 부분

- 실제 두 브라우저 탭으로 정확한 타이밍의 경쟁 상태를 재현하는 end-to-end 테스트는 하지 않았다(외부 AX Auth 서버와의 실제 리다이렉트 타이밍에 의존해 결정적으로 재현하기 어렵다) — 쿠키 저장소 동작 자체의 정확성으로 갈음했다.
