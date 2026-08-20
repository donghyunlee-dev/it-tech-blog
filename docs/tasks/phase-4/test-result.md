# Test Result — Phase 4: Comment 기능

## 실행한 검증

| 명령/시나리오 | 결과 | 비고 |
|---|---|---|
| `npm run lint` | 통과 | `CommentSection.tsx`의 `useEffect` 내 데이터 패칭 호출에 `react-hooks/set-state-in-effect` 규칙이 걸려, 표준적인 마운트 시 데이터 패칭 패턴임을 명시하는 eslint-disable 주석을 추가했다 |
| `npm run build` | 통과 | `/api/comments`가 라우트로 정상 등록됨 |
| `GET /api/comments` (pageId 없음) | 통과 | `400 Bad Request` + `INVALID_REQUEST`(api-spec.md 명세대로) |
| `GET /api/comments?pageId=test-page` (Confluence 자격증명 없음) | 통과 | `502 Bad Gateway` + `UPSTREAM_ERROR` |
| `POST /api/comments` (이메일 형식 오류, `authorEmail: "invalid-email"`) | 통과 | `400 Bad Request` + "이메일 형식이 올바르지 않습니다" |
| `POST /api/comments` (유효한 이름·이메일, Confluence 자격증명 없음) | 통과 | `502 Bad Gateway` + `UPSTREAM_ERROR`(이메일 검증을 통과한 뒤 Confluence 호출에서 실패) |

로컬 dev 서버 + 브라우저 JS(`fetch`)로 API를 직접 호출해 확인했다. `/posts/{slug}` 페이지 자체는 Confluence 자격증명이 없어 항상 "문서를 불러오지 못했습니다" 오류 상태로 먼저 종료되어(Phase 3부터 있던 조건), Comment 위젯이 실제로 마운트되는 화면은 브라우저로 확인하지 못했다.

## 미검증 항목(실 Confluence/AX Auth 자격증명 필요)

- 실제 댓글 생성·조회·대댓글 계층 구성이 Confluence footer comment API로 올바르게 동작하는지(`createFooterComment`/`listFooterComments`의 실제 필드명·페이지네이션 형식은 추정치 — docs/tasks/phase-4/spec.md 참고)
- `Comment` 위젯이 실제 게시 문서 페이지에서 렌더링되고, 댓글 작성·답글·목록 갱신이 브라우저에서 정상 동작하는지
- 댓글 알림 메일이 실제로 발송되는지(현재 구현은 요청에 `loginToken`이 없으면 항상 스킵하도록 되어 있어, 프런트엔드에 신선한 토큰을 공급하는 기능이 없는 한 실질적으로 항상 스킵된다 — 알려진 미해결 사항)
- MS 로그인 세션이 있는 상태에서 실제로 세션 이메일이 작성자로 기록되는지(AX Auth 실 자격증명 필요)

## 참고(이번 변경과 무관한 기존 조건)

- `CONFLUENCE_*`/`AX_AUTH_*`/`AUTH_SECRET`이 로컬 `.env`에 없어 관련 호출이 모두 502/오류로 처리된다. Phase 1부터 존재하던 조건이다.
