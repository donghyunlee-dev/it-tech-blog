# test-result — 무시된 Confluence 네이티브 댓글 운영 알림

| 항목 | 방법 | 결과 |
|---|---|---|
| Lint | `npm run lint` | 통과 |
| 빌드 | `rm -rf .next && npm run build` | 통과 |
| `SLACK_WEBHOOK_URL` 미설정 시 안전성 | 코드 리뷰(`notifyIgnoredNativeComment`의 try/catch) | `sendSlackAlert`가 `requireEnv` 예외를 던져도 내부에서 흡수해 로그만 남기고 상위(`listComments`/`listRecentComments`)로 전파되지 않음 확인 |
| 회귀 확인 — 상세 페이지 댓글 | 실 게시 문서(pageId `233439235`, "컴포넌트 테스트")로 `GET /api/comments` curl 직접 호출 | 기존과 동일하게 구조화된 실 댓글 1건("Claude 테스트")이 정상 반환됨 |
| 회귀 확인 — 홈 사이드바 | 브라우저(dev)로 홈 접속, fetch 완료 후 확인 | "최근 댓글" 섹션에 동일한 댓글이 정상 노출됨 |
| 회귀 확인 — 상세 페이지 댓글 카운트 | 브라우저(dev)로 상세 페이지 접속, fetch 완료 후 확인 | "댓글 1개" 정상 표시(최초 확인 시 fetch 완료 전이라 "댓글 0개"로 보였던 것은 테스트 방법상의 경합 상태였음 — 대기 후 재확인해 해소) |

## 발견된 문제

없음(위 회귀 확인 항목의 "댓글 0개"는 실제 버그가 아니라 클라이언트 fetch 완료 전 조기 확인으로 인한 테스트 방법 오류였음을 재확인으로 배제함).

## 커버되지 않은 부분

- 실제 Slack 웹훅을 울리는 전 구간(무시된 댓글 발생 → 실제 Slack 메시지 도착)은 운영 채널 노이즈 방지를 위해 이번 검증에서 실제로 트리거하지 않았다 — phase-v4-integration-qa와 동일한 원칙.
- 서버리스 다중 인스턴스 환경에서의 중복 알림 억제 한계는 코드 리뷰로만 확인했다(로컬 단일 프로세스로는 재현 불가).
