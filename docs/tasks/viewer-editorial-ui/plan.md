# plan — Viewer 에디토리얼 매거진 UI 적용

## 추가 반영 (2026-09-15): `@sfood/ui@0.1.3` 전면 도입

spec.md의 "추가 확인 및 범위 변경" 참고 — 최초 계획(순수 CSS만 사용)에서 전면 도입으로 바뀌면서 아래 영향 범위가 추가된다.

- **빌드 체인**: `package.json`에 `react`/`react-dom`을 `19.2.8` → `18.3.1`(exact), `@sfood/ui@0.1.3`(exact) 추가. `tailwind.config.mjs`(신규, `@sfood/ui/tailwind.config.js`를 preset으로 확장 + `content`에 `src/**` 및 `node_modules/@sfood/ui/dist/**` 포함), `postcss.config.mjs`(신규).
- **토큰 연결**: `globals.css` 최상단에 `@import "@sfood/ui/tokens/base.css"`·`semantic.css` + `@tailwind base/components`(파일 끝에 `@tailwind utilities`). `:root`의 `--brand-red`/`--brand-red-deep`/`--brand-red-tint`를 각각 `var(--color-brand)`/`var(--color-brand-hover)`/`var(--color-brand-subtle)`로, `body`의 `font-family`를 `var(--font-sans)`로 교체. 그 외 자체 토큰(`--text-*`/`--surface*`/`--border-hairline`/`--radius-*`/`--shadow-card`)은 에디토리얼 레이아웃 전용으로 승인된 값이라 그대로 유지.
- **다크모드 오염 방지**: `layout.tsx`의 `<html>`에 `data-theme="light"` 추가 — `@sfood/ui`의 `semantic.css`가 `prefers-color-scheme: dark`에 반응해 자동으로 어두운 토큰으로 바뀌는데, 이 저장소는 단일 라이트 테마이므로 명시적으로 고정해야 한다(실제로 이 문제를 겪고 나서 추가함).
- **CommentSection.tsx 재작성**: 게이트/신원확인 패널의 박스는 `Card`, 버튼은 `Button`(variant primary/secondary/ghost), 이름·이메일 입력은 `Input`, "인증됨" 배지는 `ColorTag`(variant success)로 교체. 신원 확인 후에는 우리 댓글 목록·작성 UI 대신 `CommentThread`를 쓰고, `onSubmit`/`onReply`를 `stage === "composer"`일 때만 전달해 "신원 확인 전엔 답글도 불가"를 자연히 성립시킨다(제공하지 않으면 `CommentThread`가 답글 버튼 자체를 숨김). 댓글 트리(`CommentNode[]`) → `@sfood/ui`의 `Comment[]` 변환 유틸(`toSfoodComments`) 추가.
- **SearchOverlay.tsx 재작성**: 커스텀 오버레이 마크업을 걷어내고 `CommandPalette`로 교체(그룹 1개, 항목은 게시글 제목/요약). `SiteHeader.tsx`에 Cmd/Ctrl+K 단축키 리스너 추가(컴포넌트 이름이 암시하는 표준 UX).
- **의도적으로 라이브러리를 쓰지 않는 부분**: `PostCard`(홈 카드 그리드), `RecentCommentsSidebar`/관련 글 리스트, 키커 라벨, 마스트헤드/히어로/시리즈 위젯/풀쿼트/콜아웃/구독 밴드/푸터는 그대로 커스텀 유지 — 근거는 spec.md·design-system-adoption.md 참고(API 제약 또는 승인된 디자인과의 시각적 충돌).

### 검증 순서 (실제로 수행한 절차)

1. `npm view @sfood/ui version peerDependencies time`, `unpkg`로 `dist/index.js`·`dist/index.d.ts` 직접 확인(크래시 시그니처 소멸, 4개 컴포넌트 실존 확인) — 설치 전에 정적으로 먼저 확인.
2. React 18.3.1 다운그레이드 + `@sfood/ui@0.1.3` 설치 + Tailwind 도입 후, **격리된 `/design-preview` 라우트**(검증 후 삭제)에서 `Button`/`ColorTag`/`Highlight`/`MultiSelect`/`CommentThread`를 실제로 렌더링 — `npm run build`(정적 프리렌더 포함) 통과 + 브라우저에서 크래시 없이 렌더링되는 것을 스크린샷/콘솔 로그로 확인.
3. 실 컴포넌트(`CommentSection`/`SearchOverlay`) 교체 후 같은 검증 반복.
4. 댓글 게이트→확인→작성 흐름을 같은 격리 라우트에서 실제로 클릭해 통과시키고, `/api/comments`로 실제 POST가 나가는 것(Confluence 쪽에서 가짜 pageId라 거부되는 정상 실패 응답까지)을 확인.
5. 홈 화면(실 서비스 Confluence 연동, 게시글 0건 상태)에서 시각적 회귀가 없는지 재확인.

## 접근 방식

`docs/guide/mockups/blog-editorial-direction.html`의 CSS/구조를 실제 Next.js 컴포넌트로 이식한다. 기존 관례(순수 CSS, `globals.css` 단일 파일, Tailwind 미사용)를 유지하고 새 추상화(CSS Modules, styled-components 등)를 도입하지 않는다.

## 영향 범위

### 데이터 계층 (최소 변경)
- `src/lib/viewer/publish-metadata.ts`: `PublishMetadata`에 optional `category?: string`, `series?: { name: string; index: number; total: number }` 필드 추가(하위 호환, Editor 미반영 시 자동 생략).
- `src/lib/viewer/posts.ts`:
  - `PublishedPostSummary`/`PublishedPostDetail`에 `metaDescription`(카드 요약용, 이미 게시 시 필수로 수집되던 값 재사용), `category?`, `readingMinutes`, `heroImageUrl?`(상세 전용) 필드 추가.
  - 신규 유틸: `estimateReadingMinutes(html)`(공백 제외 글자수/500), `extractFirstImageSrc(html)`(첫 `<img src>` 정규식 추출).
- `src/app/api/viewer/posts/route.ts`: 응답에 `metaDescription` 추가(카드 요약 표시용, 이미 내부적으로 조회 중인 값).

### 댓글 도메인 (기존 결정 반영)
- `src/lib/comments/comments.ts`: `CreateCommentInput.authorName`을 세션 존재 여부와 무관하게 받아, MS 로그인 사용자도 트리밍된 값이 있으면 `authorName`으로 사용하고 없으면 기존처럼 이메일 로컬파트로 폴백. `authorEmail`은 세션이 있으면 항상 세션 값(클라이언트 값 무시) — 보안상 위조 방지 유지.
- `src/app/api/comments/route.ts`: 변경 없음(이미 `payload.authorName`을 전달하고 있음 — 도메인 계층만 그 값을 활용하도록 수정).

### 레이아웃/프레젠테이션 (신규)
- `src/components/layout/SiteHeader.tsx` (client): `variant: "home" | "detail"` prop. 유틸리티 바 + 검색 오버레이 트리거 + 홈 마스트헤드 / 상세 슬림 sticky 헤더.
- `src/components/layout/SearchOverlay.tsx` (client): 오버레이가 열릴 때 `GET /api/viewer/posts`를 호출해 제목 기준 클라이언트 필터링.
- `src/components/layout/SiteFooter.tsx`: 구독 콜아웃 밴드 + 링크 컬럼(회사 소개 텍스트, `RELATED_SITES`, `/rss.xml`) + 저작권.
- `src/components/posts/PostCard.tsx`, `Hero.tsx`, `RecentCommentsSidebar.tsx`(빈 배열이면 렌더 안 함): 홈 화면 조립용.
- `src/components/posts/SeriesWidget.tsx`: `series` 메타데이터가 있을 때만 렌더.

### 화면
- `src/app/page.tsx`: 위 컴포넌트로 재조립.
- `src/app/posts/[slug]/page.tsx`: 위 컴포넌트로 재조립, `heroImageUrl` 유무로 히어로/시리즈 위젯 분기.
- `src/components/comments/CommentSection.tsx`: 게이트/확인/작성 3단계 상태 머신으로 전면 재작성. `isLoggedIn`이면 초기 상태를 "확인"부터 시작(게이트 생략), 이메일은 `session.user.email`로 고정 표시, 이름은 이메일 로컬파트를 제안값으로 편집 가능. 외부 방문자는 게이트→이름/이메일 입력→작성 순서. `next-auth`의 `signOut`을 "다른 사용자로"(MS 로그인 한정)에 사용.

### 스타일
- `src/app/globals.css`: 목업 토큰·클래스를 병합(브랜드 틴트, muted 서페이스, hairline 보더, 32px 라운드, hover/transition, 헤더/히어로/그리드/사이드바/검색/댓글 단계별 클래스, 풀쿼트 스타일로 `.viewer-panel-info` 재스타일링).

## 검증 전략

- `npm run build`(타입 체크 + 프리렌더 포함) 통과 확인.
- `npm run lint` 통과 확인.
- Browser 프리뷰(`npm run dev`)로 홈/상세/검색/댓글 3단계 흐름을 실제로 클릭해 확인(게시글이 없는 로컬 환경이면 Confluence 연동 실패 시의 빈 상태/에러 상태 렌더링까지 확인).
- `design-direction.md`의 925studios 체크리스트로 재점검(그라데이션 없음, 호버 있음, 균일하지 않은 라운드, 구체적 카피).
- 댓글 3단계 전환은 DOM에 실제로 이전 단계 요소가 없는지(즉 `display:none`이 아니라 조건부 렌더링인지) 코드 리뷰로 확인.

## 리스크

- Confluence 실 연동 환경이 없으면(로컬 `.env` 미설정) 게시글 목록이 항상 빈 상태로 뜬다 — 이 경우 시각적 검증은 정적 목업과의 클래스/구조 비교로 대체하고, 빈 상태 자체가 올바르게 뜨는지만 실행 확인한다.
- `authorName`을 세션 사용자에게도 허용하면 위조 가능성이 생기는 것은 이메일이 아니라 표시 이름뿐이다 — 기존에도 이메일만으로 신원을 구분했으므로 위험도 증가는 없다(design-direction.md에서 이미 결정된 사항).
- 첫 `<img>` 추출은 정규식 기반이라 Confluence 매크로로 감싼 이미지(`ac:image`)는 `converter.ts`가 아직 `<img>`로 변환하지 않을 수 있다 — 그 경우 히어로 없이 시리즈 위젯도 없는 상태로 자연 강등되며, 이는 기존 "이미지는 있으면 보너스" 원칙과 일치하므로 별도 처리하지 않는다.
