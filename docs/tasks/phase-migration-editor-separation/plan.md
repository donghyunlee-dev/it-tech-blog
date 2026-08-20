# Plan — 이관(마이그레이션): Editor/Viewer 저장소 분리

1. `C:\Users\USER\projects\sfood-it-editor`에 디렉토리 생성.
2. prd.md 이관 체크리스트의 "Editor 서비스로 이관" 목록에 있는 파일을 그대로 복사(로그인, editor 도메인 로직, editor 화면/컴포넌트, editor API 라우트, confluence 클라이언트 전체, notifications/slack.ts, api-response.ts).
3. 독립 실행 가능한 Next.js 프로젝트로 스캐폴딩: package.json(이름만 변경), tsconfig.json, next.config.ts, eslint.config.mjs, .gitignore, README.md, layout.tsx(제목만 Editor로 변경), 루트 page.tsx(로그인 세션에 따라 `/editor` 또는 `/login`으로 리다이렉트 — 기존 저장소에는 없던 파일, Editor 앱의 진입점이므로 신규 작성) 신규 작성.
4. `.env.example`을 Editor 전용 문구로 조정, 실 `.env` 값(AX_AUTH_*, CONFLUENCE_*, AUTH_SECRET, SLACK_WEBHOOK_URL)을 값 노출 없이 필터링해 복사.
5. `npm install` → `npm run lint` → `npm run build` → 개발 서버로 `/login` 링크가 실제 AX Auth clientId로 렌더링되는지 확인.
6. 새 저장소에 git init 후 초기 커밋(로컬 커밋만, push는 하지 않음).
7. 원본 저장소(Viewer)에서 숨은 의존성 해소:
   - `src/lib/errors.ts` 신설(ValidationError/NotFoundError/ConflictError/UnauthorizedError — 기존 editor/errors.ts + auth-guard.ts의 UnauthorizedError를 합침)
   - `src/lib/viewer/publish-metadata.ts` 신설(PublishMetadata 타입만 독립 정의)
   - 4개 파일(api-response.ts, viewer/posts.ts, comments/comments.ts, posts/[slug]/page.tsx, api/comments/route.ts)의 import 경로 수정
8. 원본 저장소에서 Editor 전용 파일·디렉토리 삭제(editor 도메인 로직, editor 화면/컴포넌트, editor API 라우트, auth-guard.ts, login 페이지).
9. `src/lib/confluence/client.ts`를 읽기 위주 함수만 남도록 정리(listChildPages/findChildPageByTitle/createPage/updatePage/deletePage/upsertPageProperty/uploadAttachment/findPublishedPageBySlug 제거).
10. `robots.ts`의 disallow 목록에서 더 이상 존재하지 않는 `/editor`, `/login` 제거.
11. `npm run lint` → `npm run build` → 브라우저로 `/`, `/login`(404 확인) 스모크 테스트.
12. `docs/product/prd.md`의 이관 체크리스트 항목을 완료로 갱신.

## 결정 사항

- **실수 후 즉시 정정**: `src/lib/notifications`를 Editor 이관 목록만 보고 이 저장소에서도 삭제했다가, Viewer도 Slack 알림을 쓴다는 것을 바로 알아채고 Editor 저장소에서 복사해 복원했다.
- **숨은 결합을 발견해 별도 파일로 분리**: 원래 체크리스트는 "src/lib/editor/*를 통째로 이관"이라고만 되어 있었지만, 실제로는 Viewer 쪽 4개 파일이 `@/lib/editor/errors`·`@/lib/editor/publish`에 의존하고 있었다. 이를 무시하고 그대로 삭제했다면 빌드가 깨졌을 것이므로, 공유되던 부분(에러 클래스, PublishMetadata 타입)만 Viewer 쪽에 독립적으로 재정의해 분리했다. 코드를 물리적으로 공유하지 않는다는 architecture.md의 원칙과 일치한다.
- **login 페이지는 이 저장소에서 완전히 제거**: prd.md 요구사항상 Tech Blog(Viewer)에는 별도 로그인 화면이 없어야 한다(댓글 작성 시 인라인 트리거만 존재). 기존 `/login` 페이지는 로그인 성공 시 `/editor`로 리다이렉트하는 Editor 전용 코드였고, Viewer 어디에서도 이 경로로 링크하지 않는 것을 확인했다(단, "MS 계정으로 댓글 작성" 인라인 트리거 버튼 자체는 아직 구현되어 있지 않다 — 기존에 열려 있던 별도 과제, 이번 작업 범위 아님).
- **Confluence 클라이언트 트리밍**: Viewer/Comment 코드가 실제로 import하는 함수만 grep으로 확인한 뒤(getConfiguredSpace/getPage/getPageProperty/listAllSpacePages/createFooterComment/listFooterComments/getCurrentConfluenceUser/ConfluenceApiError), 나머지 쓰기 전용 함수를 제거했다. 죽은 코드를 남겨두지 않는 것이 원칙과 맞다고 판단했다.
- **GitHub push는 이번 범위에서 제외**: 로컬 디렉토리 생성까지만 진행하기로 사용자가 확인했다(원격 저장소 생성은 되돌리기 어려운 외부 작업이라 별도 확인 필요).
