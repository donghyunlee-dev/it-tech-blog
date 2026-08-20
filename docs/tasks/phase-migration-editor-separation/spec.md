# Spec — 이관(마이그레이션): Editor/Viewer 저장소 분리

## 목표

prd.md의 "이관(마이그레이션) 체크리스트"에 따라, 지금까지 하나의 저장소(sfood-it-tech-blog)에서 함께 개발된 Editor 기능을 별도 저장소로 분리하고, 이 저장소는 Viewer(Tech Blog) 전용으로 정리한다.

## 범위

1. Editor 전용 새 저장소(`C:\Users\USER\projects\sfood-it-editor`, 로컬 형제 디렉토리) 신설 — GitHub 원격 저장소 생성/push는 이번 범위에서 제외(사용자가 직접 진행하기로 함).
2. 새 저장소에서 lint/build 통과 및 로그인 리다이렉트 동작을 검증한 뒤, 이 저장소에서 Editor 코드를 제거.
3. 이 저장소(Viewer)에 남아 있던 Editor·Viewer 간 숨은 의존성(에러 클래스, PublishMetadata 타입)을 분리해 Viewer가 Editor 코드 없이 독립적으로 빌드되도록 정리.
4. Confluence 클라이언트를 Viewer가 실제로 쓰는 읽기 위주 함수만 남기도록 정리.

## 배경 — 예상보다 깊었던 결합

기존 이관 체크리스트는 `src/lib/editor/*` 전체를 "Editor 전용 저장소로 이관"이라고만 적어 두었지만, 실제로는 Viewer 쪽 코드가 여기 의존하고 있었다:

- `src/lib/api-response.ts`(공통 오류 응답 계층)가 `@/lib/editor/errors`의 `ValidationError`/`NotFoundError`/`ConflictError`와 `@/lib/auth-guard`의 `UnauthorizedError`를 가져다 썼다.
- `src/lib/viewer/posts.ts`, `src/lib/comments/comments.ts`가 각각 `@/lib/editor/errors`(오류 클래스)와 `@/lib/editor/publish`(`PublishMetadata` 타입)를 가져다 썼다.
- `src/app/posts/[slug]/page.tsx`, `src/app/api/comments/route.ts`도 `@/lib/editor/errors`를 가져다 썼다.

`src/lib/editor/*`를 통째로 지우면 이 파일들이 전부 깨지는 상황이라, 실제로 지우기 전에 이 결합을 먼저 풀어야 했다.

## 완료 기준

- 새 저장소: `npm run lint`, `npm run build` 통과. 로그인 페이지 링크가 실제 AX Auth clientId로 정상 렌더링됨을 확인.
- 이 저장소(Viewer): Editor 관련 파일 전부 제거 후 `npm run lint`, `npm run build` 통과. `/`, `/posts/[slug]` 등 기존 라우트가 여전히 정상 동작(브라우저로 확인).
- `docs/product/prd.md`의 이관 체크리스트 항목 갱신.

## 미확인 사항 / 다음 결정 필요

- GitHub 원격 저장소 생성·push는 사용자가 별도로 진행.
- AX Auth Editor용/Viewer용 clientId 분리 등록은 아직 하지 않음(이관 체크리스트에 그대로 남아 있음).
- Editor 저장소의 `.claude/launch.json`, `next-env.d.ts` 등은 로컬 개발 편의를 위한 것으로 커밋에 포함했다(Next.js가 자동 생성하는 `AGENTS.md`/`CLAUDE.md`의 Next.js 안내 블록도 동일하게 자동 생성되어 포함됨 — 이 저장소의 기존 관례와 동일).
