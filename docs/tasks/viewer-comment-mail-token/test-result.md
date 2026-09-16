# test-result — 댓글 알림 메일용 신선한 login_token 확보

| 항목 | 명령/방법 | 결과 |
|---|---|---|
| Lint | `npm run lint` | 통과 |
| 빌드 | `rm -rf .next && npm run build` | 통과 |
| 대기 중인 댓글 + 잘못된 토큰 | `ax_pending_comment`/`ax_return_to` 쿠키를 실은 채 존재하지 않는 `login_token`으로 `/api/auth/ax-callback` 호출 | `307`, `Location: .../posts/...?error=comment_failed` — 검증 실패 시 댓글이 생성되지 않고(코드상 `verifyLoginToken` 실패 지점에서 즉시 반환) 원래 게시글로 에러 코드와 함께 돌아옴을 확인 |
| 대기 중인 댓글 쿠키 없음 + 잘못된 토큰 | 동일 요청에서 `ax_pending_comment` 쿠키만 제거 | 기존 `signIn()` 경로(NextAuth 내부 콜백)로 그대로 진입 — 이번 변경으로 인한 회귀 없음 |
| `login_token` 자체 없음 | 쿼리 파라미터 없이 호출 | `307`, `Location: /?error=missing_token` — 기존 동작과 동일(회귀 없음) |
| `?error=` 배너(comment_failed) | `curl "/posts/{slug}?error=comment_failed"` | "댓글 인증에 실패해 작성 중이던 내용이 저장되지 않았습니다. 다시 입력해 주세요." 노출 확인 |
| `?error=` 배너(알 수 없는 코드) | `curl "/posts/{slug}?error=some_unknown_code"` | 공용 fallback 문구("요청 처리 중 문제가 발생했습니다...") 노출 확인 |
| 브라우저 렌더링 | `preview_start`(dev)로 실 게시 문서 접속 | 콘솔 에러 없이 게이트 화면("MS 계정으로 인증" 버튼 포함) 정상 렌더링, `/api/comments` 조회 정상(200) |

## 커버되지 않은 부분(사용자 직접 검증 필요)

- **해피 패스 전체(실 MS 로그인 → 리다이렉트 왕복 → 댓글 생성 → 메일 발송)**: 실제 Microsoft 계정 로그인이 필요해 AI가 대신 수행할 수 없고(자격증명 입력 금지), 성공 시 실 프로덕션 Confluence에 댓글이 기록된다 — 이전 태스크들(phase-v3, viewer-recent-comments)과 동일하게 사용자가 직접 로그인 상태에서 댓글을 저장해 보고, 문서 작성자 메일함으로 알림 메일 수신 여부를 확인해야 한다.
- 쿠키 크기 초과(매우 긴 댓글) 시 직접 POST로 폴백되는 경로는 로직 검토로만 확인했다(실제로 4KB에 가까운 댓글을 입력해 보는 수동 테스트는 하지 않음).
- 브라우저 쿠키가 차단된 환경에서의 동작은 별도로 확인하지 않았다(기존 세션 쿠키 의존과 동일한 전제).
