# Plan — Phase 4: Comment 기능

## 영향 범위

- `src/lib/confluence/client.ts` (추가: `createFooterComment`, `listFooterComments`)
- `src/lib/ax-auth/client.ts` (추가: `sendMail`)
- `src/lib/comments/comments.ts`, `structured-body.ts`, `notify.ts` (신규)
- `src/app/api/comments/route.ts` (신규)
- `src/components/comments/CommentSection.tsx` (신규, client component)
- `src/app/posts/[slug]/page.tsx` (수정: Comment 위젯 임베드)
- `src/app/globals.css` (댓글 목록/폼 스타일 추가)
- `docs/product/prd.md` (Phase 4 체크리스트 갱신)

## 기술적 접근

1. **`confluence/client.ts` 추가 함수**
   - `createFooterComment({ pageId, parentCommentId?, bodyValue }): Promise<{ id: string; createdAt: string }>` — `POST /api/v2/footer-comments`.
   - `listFooterComments(pageId): Promise<Array<{ id: string; parentCommentId: string | null; bodyValue: string; createdAt: string }>>` — `GET /api/v2/pages/{pageId}/footer-comments?body-format=storage`, 기존 `listAllSpacePages`와 동일한 커서 페이지네이션(`_links.next`) 패턴을 따른다.

2. **`src/lib/comments/structured-body.ts`**
   - `formatStructuredBody({ authorName, authorEmail, body }): string` — Confluence storage format 문단(`<p>이름 | 이메일 | 댓글(escape 처리)</p>`)으로 직렬화.
   - `parseStructuredBody(storageValue): { authorName, authorEmail, body } | null` — HTML 태그 제거 후 `" | "` 기준 앞 2개 구분자까지만 분리.

3. **`src/lib/comments/comments.ts`**
   - `CreateCommentInput`: `{ pageId, parentCommentId?, body, session?: { email } | null, authorName?, authorEmail? }`.
   - `createComment(input)`: 세션이 있으면 `authorType = "ms_user"`이고 세션 이메일/이름(이메일 로컬파트를 표시 이름으로 사용)을 사용, 클라이언트가 보낸 `authorName`/`authorEmail`은 무시한다. 세션이 없으면 `authorType = "external"`이고 `authorName`/`authorEmail` 필수 + 이메일 형식 검증(`ValidationError`). `body`가 비어 있으면 `ValidationError`. `createFooterComment` 호출 시 404(Confluence)를 `NotFoundError`로 변환.
   - `listComments(pageId)`: `listFooterComments`로 전체를 한 번에 가져와 각 레코드를 `parseStructuredBody`로 파싱하고, `parentCommentId` 기준으로 메모리에서 트리를 구성한다(Map으로 자식 목록을 그룹핑한 뒤 재귀적으로 `replies` 배열을 채움). 파싱에 실패한 레코드(예: 형식이 깨진 경우)는 목록에서 제외하고 서버 로그에 남긴다.
   - 댓글 알림 메일 발송에 필요한 문서 메타(제목, 작성자 이메일, canonical URL)를 조회하는 헬퍼도 이 모듈에 둔다(기존 `getPage`, `getPageProperty(pageId, "authorMeta")`, `getPageProperty(pageId, "publishMetadata")` 재사용).

4. **`src/lib/ax-auth/client.ts`에 `sendMail` 추가**: mail-integration-guide.md의 `POST /mail/send` 호출. 요청 실패·네트워크 오류는 `{ success: false, reason }`으로 흡수(예외를 던지지 않음 — `verifyLoginToken`과 동일한 방어적 패턴).

5. **`src/lib/comments/notify.ts`**
   - `notifyCommentAdded(input)`: `loginToken`과 문서 작성자 이메일이 모두 있을 때만 `sendMail` 호출. 실패해도 예외를 던지지 않고 로그만 남긴다(댓글 생성 흐름이 이 함수의 결과를 기다리지 않아도 되도록 절대 throw하지 않는 것이 계약).

6. **`POST /api/comments`**: `auth()`로 세션을 선택적으로 조회(세션 없어도 401이 아님 — 외부 사용자 허용). `createComment` 호출 후, 작성자가 `ms_user`이면 `notifyCommentAdded`를 호출하되 그 결과를 기다리는 것이 API 응답 지연으로 이어지지 않도록 `await`는 하되 알림 실패가 응답에 영향을 주지 않게 한다(알림 함수 자체가 항상 성공적으로 resolve됨).

7. **`GET /api/comments`**: 쿼리스트링 `pageId` 필수(없으면 400). `listComments` 결과를 api-spec.md 응답 스키마(`commentId`, `authorName`, `body`, `createdAt`, `replies`)로 변환해 반환한다 — `authorEmail`은 응답에 포함하지 않는다.

8. **`CommentSection` 컴포넌트(client)**: 댓글 목록(재귀 렌더링), 답글 버튼, 작성 폼(로그인 여부는 서버에서 이미 판단하므로 클라이언트는 로그인 세션 존재 여부만 prop으로 받아 이름/이메일 입력란 노출 여부를 결정). 제출 후 `router.refresh()`로 목록 갱신(Editor의 `PublishForm` 패턴과 동일).

9. **`src/app/posts/[slug]/page.tsx`**: 세션을 확인(`auth()`)해 로그인 여부를 `CommentSection`에 전달하고, `pageId`를 함께 넘긴다.

## 검증 전략

- `npm run lint`, `npm run build` (자격증명 없이 통과해야 함).
- 로컬 dev 서버로 `/posts/{slug}`에 댓글 위젯이 렌더링되는지, `GET/POST /api/comments`가 Confluence 자격증명 없을 때 502로 명확히 응답하는지 확인.
- 실제 Confluence 데이터로 댓글 작성·계층 조회·알림 메일 발송은 자격증명 부재로 검증하지 못한다.

## 리스크

- Confluence footer comment API의 실제 필드명·페이지네이션 형식이 가정과 다를 수 있다(spec.md 참고). 실 연동 시 `confluence/client.ts`의 해당 함수만 수정하면 되도록 계층을 분리해 두었다.
- 댓글 알림 메일은 신선한 `login_token` 확보 UX가 아직 없어, 현재 구현대로라면 실제로는 거의 항상 "토큰 없음 → 스킵"으로 동작할 가능성이 높다. 이는 알려진 미해결 사항이다(spec.md 참고).
