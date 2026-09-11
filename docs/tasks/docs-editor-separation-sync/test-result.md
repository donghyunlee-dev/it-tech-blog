## 실행한 검증

1. `Glob src/app/api/**/*` — 이 저장소에 실제 존재하는 API 라우트 확인
   - 결과: `api/auth/[...nextauth]`, `api/health/confluence`, `api/viewer/posts`, `api/viewer/posts/[slug]`, `api/comments`, `api/auth/ax-callback` 6개뿐. `/api/editor/*`는 존재하지 않음을 확인 → api-spec.md에서 해당 엔드포인트 상세 제거 근거로 사용.
2. `src/app/api/auth/ax-callback/route.ts`, `src/lib/auth.ts` 코드 읽기
   - 결과: 성공 시 `ax_return_to` 쿠키에 저장된 원래 게시글 경로(없으면 `/`)로 리다이렉트, 실패는 사유 구분 없이 NextAuth 표준 처리로 `/`(홈)에 `?error=CredentialsSignin`, 토큰 자체가 없으면 원래 경로에 `?error=missing_token`. 기존 api-spec.md의 "`/editor`로 리다이렉트, `TOKEN_EXPIRED`/`TOKEN_ALREADY_USED`/`TOKEN_NOT_FOUND` 사유별 분기" 서술과 불일치함을 확인 → 정정.
3. `Grep "prd\.md#|api-spec\.md#|architecture\.md#"` (docs 전체)
   - 결과: 0건. 다른 문서가 이번에 축약한 섹션을 앵커 링크로 참조하지 않음을 확인.
4. `Grep "/api/editor"` (docs 전체, 수정 후)
   - 결과: `docs/product/{prd,api-spec,architecture}.md`에는 더 이상 없음. `docs/tasks/phase-*`(범위 제외로 유지하기로 한 과거 task 기록)에만 남아 있음 — 의도한 상태.

## 실패/미검증 항목

- 코드 동작 자체(빌드/lint/런타임)는 이번 변경 대상이 아니므로 실행하지 않음 — 문서만 수정했으며 변경 범위에 코드가 없음.

## 재검증 필요 여부

없음. 문서 정리 작업이며 후속 코드 변경이 발생하면 그때 별도로 검증한다.
