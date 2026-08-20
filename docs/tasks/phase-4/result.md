# Result — Phase 4: Comment 기능

## 배달된 범위

`docs/product/prd.md` Phase 4(Comment 기능) 체크리스트 5개 항목("대댓글 및 댓글 계층 조회"와 "댓글 조회 성능 최적화"는 spec.md에 기록한 대로 하나의 구현으로 통합) 모두, Confluence/AX Auth 실 자격증명 없이 완료 가능한 코드 범위를 구현했다.

## 변경/생성 파일

- `src/lib/confluence/client.ts`: `createFooterComment`, `listFooterComments` 추가
- `src/lib/ax-auth/client.ts`: `sendMail` 추가
- `src/lib/site.ts`(신규): `getSiteBaseUrl` 공용 유틸(기존 `viewer/posts.ts`/`sitemap.ts`/`rss.xml/route.ts`에 중복 정의되어 있던 것을 통합)
- `src/lib/comments/structured-body.ts`(신규): `이름 | 이메일 | 댓글` 구조화 직렬화/파싱
- `src/lib/comments/comments.ts`(신규): `createComment`, `listComments`, `getDocumentNotificationMeta`
- `src/lib/comments/notify.ts`(신규): `notifyCommentAdded`
- `src/app/api/comments/route.ts`(신규): `GET`/`POST`
- `src/components/comments/CommentSection.tsx`(신규): 댓글 목록·답글·작성 폼 클라이언트 컴포넌트
- `src/app/posts/[slug]/page.tsx`: `CommentSection` 임베드, 로그인 세션 여부 전달
- `docs/product/prd.md`: Phase 4 체크리스트 상태·산출물 갱신
- `docs/tasks/phase-4/{spec.md,plan.md,tasks.md,test-result.md,result.md}`(본 문서)

## 핵심 결정

- **"계층 조회"와 "조회 성능 최적화"를 하나로 통합**: prd.md는 원래 두 단계(먼저 단순 재귀 조회 → 나중에 전체 조회 후 메모리 구성으로 전환)로 나눠 정의했지만, 처음부터 새로 구현하는 상황이라 굳이 나눠서 만들 이유가 없었다. `listComments`는 문서당 1회의 Confluence 호출로 전체 댓글을 가져온 뒤 메모리에서 `parentCommentId` 기준 트리를 구성한다. 이렇게 두 체크리스트 항목을 함께 충족했다(docs/tasks/phase-4/spec.md에 결정 사유 기록).
- **부모 댓글 유실 시 최상위로 승격**: `parentCommentId`가 가리키는 댓글이 존재하지 않거나(삭제, 파싱 실패 등) 목록에 없는 경우, 해당 댓글을 최상위로 끌어올려 화면에서 계속 보이게 했다(prd.md "부모 댓글이 삭제된 경우에도 하위 댓글 계층은 유지" 요구사항 반영).
- **세션 신원 우선, 클라이언트 입력값 무시**: 로그인 세션이 있으면 `authorName`/`authorEmail`을 요청 본문 값이 아니라 세션 정보로 강제한다(신원 위장 방지).
- **공개 API 응답에 이메일 미노출**: `GET /api/comments` 응답에는 `authorEmail`을 포함하지 않는다(api-spec.md 명세와 일치, 개인정보 보호).
- **댓글 알림 메일은 배선만 구현하고 트리거 UX는 미해결로 남김**: 사용자가 이전 대화에서 "로그인 후 메일 보내는 기능 구현 시 테스트하면서 적용 여부를 다시 판단하겠다"고 명시했고, AX Auth의 `login_token`은 180초·1회성이라 댓글 작성 시점에 항상 신선한 토큰을 확보할 UX(예: 제출 직전 팝업 재인증)가 아직 없다. `POST /api/comments`는 선택적 `loginToken` 필드를 받아, 있을 때만 `notifyCommentAdded`를 시도하고 없으면 조용히 건너뛴다. **현재 프런트엔드(`CommentSection`)는 이 필드를 보내지 않으므로, 실질적으로 알림 메일은 아직 발송되지 않는다** — 신선한 토큰 확보 UX는 후속 작업이 필요하다.
- **`getSiteBaseUrl` 중복 제거**: Phase 3에서 3곳에 중복 정의되어 있던 함수를 `src/lib/site.ts`로 통합하고, 이번에 추가한 `comments.ts`도 이를 재사용하도록 했다(4번째 중복이 생기는 시점에 통합).
- **Confluence footer comment API 스펙은 추정치**: 실제 Confluence 인스턴스로 검증되지 않았다(docs/tasks/phase-4/spec.md "가정 및 미확인 사항" 참고). 계층 분리(`confluence/client.ts` ↔ `comments/comments.ts`) 덕분에, 실 스펙이 다르면 `confluence/client.ts`의 두 함수만 수정하면 된다.

## 검증 결과

`docs/tasks/phase-4/test-result.md` 참고. `npm run lint`/`npm run build` 통과. 로컬 dev 서버 + 브라우저 JS로 `GET/POST /api/comments`의 입력 검증(400)과 Confluence 연동 실패(502) 응답을 확인했다. Comment 위젯 자체는 `/posts/{slug}` 페이지가 Confluence 자격증명 없이는 항상 오류 상태로 먼저 종료되어 브라우저에서 마운트된 모습을 확인하지 못했다.

## 열린 과제(Open Gaps)

- **Confluence footer comment 실 연동 검증**: 자격증명이 준비되면 `createFooterComment`/`listFooterComments`의 실제 응답 형식을 확인하고, 다르면 `confluence/client.ts`만 수정하면 된다.
- **댓글 알림 메일 트리거 UX**: 댓글 제출 시점에 신선한 AX Auth `login_token`을 확보하는 방법(예: 제출 직전 팝업 재인증, 또는 다른 설계)을 사용자가 직접 검토하기로 했다. 결정되면 `CommentSection`이 그 토큰을 `POST /api/comments`의 `loginToken` 필드로 함께 보내도록 프런트엔드를 수정해야 한다.
- **댓글 위젯 실제 렌더링 확인**: Confluence 자격증명이 준비되면 실제 게시 문서 페이지에서 댓글 작성·답글·계층 표시가 브라우저에서 정상 동작하는지 확인해야 한다.

## Next Steps

- Confluence/AX Auth 자격증명이 준비되면 Phase 1~4 전체의 실 연동을 한 번에 재검증할 수 있다.
- Phase 5(운영 자동화 및 마무리)로 이어서 진행할지, 자격증명부터 준비할지 확인이 필요하다.
