# test-result — 댓글 알림 콜백의 실패 원인 구분

| 항목 | 방법 | 결과 |
|---|---|---|
| Lint | `npm run lint` | 통과 |
| 빌드 | `rm -rf .next && npm run build` | 통과 |
| 인증 실패 경로 | 잘못된 `login_token` + 대기 중인 댓글 쿠키로 `/api/auth/ax-callback` 호출 | `307`, `Location: .../posts/...?error=comment_auth_failed`(기존 `comment_failed`에서 코드명 변경) 확인 |
| 인증 실패 배너 문구 | `curl "/posts/{slug}?error=comment_auth_failed"` | "댓글 작성자 인증에 실패해 저장되지 않았습니다. 다시 시도해 주세요." 노출 확인 |
| 저장 실패 배너 문구 | `curl "/posts/{slug}?error=comment_save_failed"` | "댓글 저장에 실패했습니다. 다시 입력해 주세요." 노출 확인 |
| 저장 성공 + 알림 실패 시 에러 코드 없음 | 코드 레벨 검토(`completePendingComment`) | `created`가 설정된 이후의 알림 블록은 자체 `try/catch`로 분리되어 있어, 이 블록에서 발생한 예외는 `redirectPath`를 변경하지 않고 `console.error`로만 기록됨을 확인 — 실 계정으로 이 경로(댓글 저장은 성공, 메일만 실패)를 재현하려면 AX Auth `MAIL_SEND_FAILED` 등 서버 측 실패를 인위적으로 유도해야 해 이번 검증에서는 코드 레벨 확인으로 갈음 |

## 커버되지 않은 부분

- "댓글 생성 성공 + 알림 메일 실패"의 전 구간 실측(실제로 메일 발송이 실패하는 상황을 인위적으로 만들어야 함)은 실 계정 자원을 소모하는 작업이라 이번 검증에서는 코드 레벨 확인으로 대체했다.
