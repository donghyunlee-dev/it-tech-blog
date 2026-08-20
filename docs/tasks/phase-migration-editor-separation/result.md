# Result — 이관(마이그레이션): Editor/Viewer 저장소 분리

## 배달된 범위

- Editor 서비스를 별도 로컬 저장소(`C:\Users\USER\projects\sfood-it-editor`)로 분리하고, lint/build/로그인 리다이렉트 동작을 검증했다.
- 이 저장소(sfood-it-tech-blog)를 Viewer(Tech Blog) 전용으로 정리했다 — Editor 관련 코드를 전부 제거하고, 그 과정에서 드러난 숨은 결합(에러 클래스, PublishMetadata 타입)을 Viewer 쪽에 독립적으로 재정의해 두 저장소가 코드를 공유하지 않도록 정리했다.

## 새 저장소: sfood-it-editor

- 위치: `C:\Users\USER\projects\sfood-it-editor`(로컬 git 저장소, 초기 커밋 `d386390` 완료 — GitHub 원격 저장소 생성/push는 미진행)
- 포함: 로그인(Auth.js + AX Auth 리다이렉트), 문서 CRUD, 이미지 등록, 게시 설정, Slack 이상 알림, 공통 오류 응답 계층
- lint/build 통과, 로그인 페이지가 실 AX Auth clientId로 정상 렌더링됨을 확인

## 원본 저장소: sfood-it-tech-blog(Viewer 전용으로 정리됨)

### 삭제한 것
`src/lib/editor/*`, `src/lib/auth-guard.ts`, `src/app/editor/*`, `src/components/editor/*`, `src/app/api/editor/*`, `src/app/login/page.tsx`

### 새로 만든 것
- `src/lib/errors.ts`: `ValidationError`/`NotFoundError`/`ConflictError`/`UnauthorizedError` — 기존 `editor/errors.ts` + `auth-guard.ts`에서 옮겨온 것으로, 삭제된 Editor 코드에 더 이상 의존하지 않는다.
- `src/lib/viewer/publish-metadata.ts`: `PublishMetadata` 타입 — Editor가 Confluence content property에 쓰는 형태를 Viewer가 독립적으로 정의한 읽기 전용 타입.

### 정리한 것
- `src/lib/confluence/client.ts`: 쓰기 전용 함수(createPage/updatePage/deletePage/upsertPageProperty/uploadAttachment/listChildPages/findChildPageByTitle/findPublishedPageBySlug) 제거, Viewer/Comment가 실제로 쓰는 읽기 위주 함수 + `createFooterComment`/`listFooterComments`만 남김.
- `src/app/robots.ts`: 더 이상 존재하지 않는 `/editor`, `/login` 경로를 disallow 목록에서 제거.

## 핵심 결정

- **숨은 결합 발견 후 분리**: prd.md의 기존 이관 체크리스트는 "src/lib/editor/* 전체를 이관"이라고만 되어 있었지만, 실제로는 `api-response.ts`, `viewer/posts.ts`, `comments/comments.ts`, `posts/[slug]/page.tsx`, `api/comments/route.ts` 5개 파일이 Editor의 에러 클래스·PublishMetadata 타입에 의존하고 있었다. 그대로 삭제했다면 Viewer가 빌드조차 되지 않았을 것이다. 공유되던 부분만 Viewer 쪽에 독립적으로 재정의해, architecture.md의 "코드를 공유하지 않는다" 원칙을 실제로 지키도록 정리했다.
- **로그인 페이지는 이 저장소에서 완전히 제거**: prd.md 요구사항상 Viewer에는 별도 로그인 화면이 없어야 하고(댓글 작성 시 인라인 트리거만 존재), 기존 `/login` 페이지는 로그인 성공 시 `/editor`로 리다이렉트하는 Editor 전용 코드였다. Viewer 어디에서도 이 경로로 링크하지 않는 것을 확인한 뒤 제거했다.
- **작업 중 실수 2건을 즉시 발견·정정**: (1) `src/lib/notifications`를 Editor 이관 목록만 보고 함께 삭제했다가 Viewer도 이 모듈을 쓴다는 것을 알아채고 즉시 복원, (2) 첫 build에서 `@/lib/auth-guard` 모듈을 찾지 못하는 오류로 `UnauthorizedError` 의존성 누락을 발견해 `errors.ts`에 추가. 두 경우 모두 lint/build 검증 단계에서 바로 잡혔다.
- **GitHub 원격 저장소 생성/push는 범위에서 제외**: 사용자가 로컬 디렉토리 생성까지만 먼저 진행하기로 확인했다. 되돌리기 어려운 외부 작업이라 별도 확인이 필요하다.

## 검증 결과

`docs/tasks/phase-migration-editor-separation/test-result.md` 참고. 두 저장소 모두 lint/build 통과. Viewer 저장소는 브라우저로 `/`(정상), `/login`(404, 의도된 결과) 확인.

## 열린 과제(Open Gaps)

- GitHub 원격 저장소 생성 및 push(Editor), 이 저장소의 배포 설정을 공개 도메인 전용으로 정리(Viewer) — 사용자가 직접 진행하기로 함.
- AX Auth에 Editor용/Viewer용 clientId를 각각 별도로 등록 요청 — 현재는 기존 하나의 clientId를 두 저장소의 `.env`에 그대로 복사해 둔 상태(둘 다 같은 clientId를 임시로 공유 중). Editor는 배포 후 콜백 URL이 확정되면(Phase E1 계획대로) 새 clientId를 등록받아야 하고, Viewer도 댓글 로그인용으로 별도 clientId가 필요하다.
- ~~"MS 계정으로 댓글 작성" 인라인 로그인 트리거 버튼 자체가 아직 구현되어 있지 않음~~ — 후속 작업으로 구현 완료([phase-v3-comment-login-trigger/result.md](../phase-v3-comment-login-trigger/result.md) 참고).
- 기존에 열려 있던 과제(api-spec.md 분리, 댓글 알림 메일 신선한 login_token UX)는 그대로 유지된다.

## Next Steps

- Editor 저장소를 GitHub에 올릴지, 로컬에서 더 작업할지 확인.
