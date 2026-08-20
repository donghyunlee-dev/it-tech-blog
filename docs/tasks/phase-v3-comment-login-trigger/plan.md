# Plan — Phase V3: 댓글 작성 인라인 로그인 트리거

1. `src/lib/auth.ts`의 `pages.signIn`을 삭제된 `/login` 대신 `/`로 변경.
2. `src/app/api/auth/ax-callback/route.ts`를 재작성 — 요청 쿠키(`ax_return_to`)에서 돌아갈 경로를 읽어(상대 경로만 허용) `signIn`의 `redirectTo`로 사용, 하드코딩되어 있던 `/editor` 제거.
3. `src/app/posts/[slug]/page.tsx`에서 `getAxAuthLoginUrl()`을 호출해 `loginUrl`을 계산하고 `CommentSection`에 prop으로 전달.
4. `src/components/comments/CommentSection.tsx`:
   - `loginUrl` prop을 `CommentSection` → `CommentItem`/`CommentForm`까지 전체 스레딩.
   - `startAxAuthLogin(loginUrl)` 헬퍼 추가 — 현재 경로를 `ax_return_to` 쿠키에 저장한 뒤 `window.location.href = loginUrl`로 이동.
   - 로그인하지 않은 사용자에게 "MS 계정으로 댓글 작성" 버튼을 외부 사용자용 이름/이메일 입력 폼 위에 노출.
5. `npm run lint` → `npm run build`.
6. Confluence에 임시 게시 문서 1건을 만들어 브라우저로 버튼 노출·클릭 시 쿠키 설정·AX Auth 리다이렉트까지 확인 후 테스트 문서 삭제.
7. `docs/product/prd.md` Phase V3 상태 갱신.

## 결정 사항

- **콜백의 돌아갈 위치를 AX Auth 쪽 state 파라미터가 아니라 우리 쿠키로 직접 관리**: login-integration-guide.md에 임의 상태값 왕복에 대한 언급이 없어, AX Auth의 미확인 동작에 의존하지 않는 방식을 택했다.
- **버튼과 외부 사용자 입력 폼을 동시에 노출**: prd.md는 "MS 로그인 사용자 댓글 작성"과 "외부 사용자 댓글 작성"을 별개 기능으로 정의하고 있고, 화면 정의에도 로그인 트리거 버튼과 별개로 외부 사용자 흐름이 존재해야 한다. 둘 중 하나를 선택하게 하지 않고 둘 다 노출해 사용자가 고르게 했다.
- **분리 과정에서 깨져 있던 콜백 경로도 함께 수정**: `/editor`로 하드코딩된 리다이렉트는 이번 기능과 무관하게 이미 깨져 있던 버그였지만, 같은 파일을 손대는 김에 함께 고쳤다(별도 파일을 새로 열 필요가 없는 최소 범위 수정).
