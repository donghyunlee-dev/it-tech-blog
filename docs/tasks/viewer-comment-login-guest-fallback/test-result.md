# test-result — 댓글 로그인 UX 단순화

## 자동 검증

- `npm run lint` — 통과 (변경마다 3회 재실행, 매번 통과)
- `npm run build` — 통과, 신규 라우트 `/api/auth/ax-signin-failed` 정상 등록 확인

## 수동 엔드투엔드 검증 (실 Confluence 연동, 실 게시글 `test-fa031d2f-...`)

| 항목 | 결과 |
|---|---|
| 게이트 화면에 "로그인" 버튼 하나만 노출, "사내 직원"/"외부 방문자" 문구 없음 | ✅ 확인 |
| "로그인" 클릭 → 실제 AX Auth 로그인 시작 URL(`https://ax-auth.s-food.ai/auth/login/...`)로 리다이렉트 | ✅ 확인 |
| `pages.signIn`(`/api/auth/ax-signin-failed`)이 `ax_return_to` 쿠키를 읽어 원래 글로 `?comment=guest`와 함께 리다이렉트 | ✅ 확인(직접 호출로 재현) |
| `?comment=guest` 진입 시 오류 문구 없이 이메일·이름 입력 화면으로 바로 전환 | ✅ 확인 |
| 이메일·이름이 비어 있으면 댓글 textarea 자체가 보이지 않음(안내 문구만) | ✅ 확인 |
| 이메일·이름을 채우면 즉시 textarea(+"댓글 등록" 버튼)가 나타남 | ✅ 확인 |
| 게스트로 댓글 작성 → `POST /api/comments` → `201 Created` | ✅ 확인 |
| 새로고침 후 목록에 새 댓글이 올바른 이름·시각으로 표시, "댓글 N개" 갱신 | ✅ 확인 |
| 콘솔 에러 없음(정상 흐름 기준) | ✅ 확인 |

### 검증하지 못한 것 (한계)

- **MS 로그인 성공 경로**는 실제 사내 Microsoft 계정으로 로그인을 완료해야 하는데, 이 환경(샌드박스 브라우저)에는 그런 계정이 없어 실제로 완주해보지 못했다. 코드 리뷰로는 기존에 검증됐던 `signIn("ax-auth", ...)` 성공 경로(세션 생성 → `verified=true` → 이메일 잠금 UI)를 그대로 재사용하므로 회귀 위험은 낮다고 판단하지만, 실측은 아니다.
- 로컬 `.env`의 `AX_AUTH_REDIRECT_URI`가 `localhost:3000`으로 고정되어 있는데, 이번 세션 dev 서버는 3000번 포트가 이미 사용 중이라 다른 포트(49910)로 떴다. 그 결과 AX Auth가 `INVALID_REDIRECT_URI`를 반환해 AX Auth 자체 로그인 화면까지도 못 갔다 — 이건 로컬 개발 환경의 포트 충돌 문제이며 이번 코드 변경과 무관하다(운영 환경은 고정 도메인이라 해당 없음).

## 진행 중 발견한 별도 버그 (수정함, 범위 확장)

`ConfluenceFooterComment.createdAt`이 최상위 필드라고 잘못 가정되어 있었다(실제로는 `version.createdAt`에 있음). 게시글에 최상위 댓글이 2개 이상일 때만 `.sort()` 비교 함수가 실제로 호출되어 `undefined.localeCompare` 예외가 터지는 잠복 버그였다 — 이번 게스트 댓글 작성 검증 중 두 번째 댓글을 실제로 남기면서 처음 발견했다(그 전까지는 게시글마다 댓글이 1개뿐이라 드러나지 않았음). 기존 댓글의 시각도 "Invalid Date"로 잘못 표시되고 있었는데, 수정 후 정상 표시됨을 확인했다.

- 수정 파일: `src/lib/confluence/client.ts`(`ConfluenceFooterComment` 인터페이스), `src/lib/comments/comments.ts`(3곳의 `.createdAt` 접근을 `.version.createdAt`으로 수정)
- 이 버그는 이번 작업 범위(spec.md) 밖이지만, 요청하신 "댓글 저장까지 프로세스 검증"을 완료하려면 목록이 정상 표시돼야 해서 함께 고쳤다.
