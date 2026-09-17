# result — 댓글 알림 콜백의 실패 원인 구분

## 요약

자체 코드 리뷰 2번 항목을 해결했다. `completePendingComment`의 단일 catch를 "댓글 생성"과 "알림 메일 발송"으로 분리해, 인증 실패(`comment_auth_failed`)와 저장 실패(`comment_save_failed`)를 서로 다른 코드로 안내하고, 댓글이 실제로 저장된 뒤 알림 메일만 실패한 경우에는 사용자에게 실패로 보이지 않도록(조용히 로그만 남김) 바꿨다 — 이전에는 이 경우도 "저장되지 않았습니다"로 잘못 안내되어 중복 댓글 작성을 유도할 위험이 있었다.

## 변경 파일

- `src/app/api/auth/ax-callback/route.ts` — `completePendingComment`를 인증 실패/댓글 생성 실패/알림 실패 세 갈래로 분리
- `src/app/posts/[slug]/page.tsx` — `AUTH_ERROR_MESSAGES`에 `comment_auth_failed`/`comment_save_failed` 추가(기존 `comment_failed` 제거)

## 검증

- `npm run lint`/`npm run build` 통과
- 인증 실패 경로가 새 코드(`comment_auth_failed`)로 리다이렉트되고 올바른 문구를 보여줌을 확인
- 저장 실패 문구가 올바르게 노출됨을 확인
- 저장 성공+알림 실패 시 에러 코드가 붙지 않음을 코드 레벨로 확인(실측은 실 계정 자원 소모로 생략)
- 상세는 [test-result.md](test-result.md) 참고

## 열린 과제

- 없음. `docs/product/prd.md`의 해당 체크리스트 항목을 완료로 갱신한다.
