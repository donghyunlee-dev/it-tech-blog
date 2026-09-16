# result — Viewer 에디토리얼 매거진 UI 적용

## 요약

`design-direction.md`가 확정한 "에디토리얼 매거진형" 디자인을 실제 Next.js 화면(홈/상세/댓글)에 적용했다. **같은 날 안에 두 단계로 진행됐다**: ① 착수 시점엔 `@sfood/ui`가 여전히 크래시 상태라 자체 CSS 토큰으로 구현 → ② 담당팀이 `@sfood/ui@0.1.3`을 배포해 문제를 실제로 해결했음을 확인한 뒤, 사용자 확인을 거쳐 React 18 다운그레이드 + Tailwind 도입 + `@sfood/ui` 전면 도입으로 다시 반영했다. 아래는 최종(② 반영 후) 상태 기준이다.

## MCP/`@sfood/ui` 재확인 결과 (2단계로 진행)

**1차 확인(착수 시점)**: MCP 서버 자체는 정상 응답하고 `CommentThread`가 메타데이터에 나타났지만, 실제 npm 패키지(`@sfood/ui@0.1.2`)는 변경되지 않은 상태였다(크래시 원인 `ReactCurrentDispatcher` 그대로, `CommentThread` 등 4개 컴포넌트 미배포). 그래서 최초에는 자체 CSS 토큰으로 구현했다.

**2차 확인(같은 날, 담당팀 수정 배포 후)**: 담당팀이 `@sfood/ui@0.1.3`을 배포하며 6개 수정 사항(React 크래시 수정, 4개 컴포넌트 배포, MCP 다크모드 토큰, 브랜드 컬러/폰트 정리, MCP SDK 런타임 제외)을 전달했다. 이번에도 벤더 주장을 그대로 믿지 않고 `npm view`/`unpkg`로 정적 확인 후, **실제로 React 18.3.1 + `@sfood/ui@0.1.3`을 설치해 격리 라우트에서 렌더링까지 검증**했다 — 크래시 없이 정상 동작함을 직접 확인했다. 상세 근거는 [design-system-adoption.md](../../guide/design-system-adoption.md)의 "2026-09-15 최종 확인 및 전면 도입" 절 참고.

**결론: 전면 도입.** React 19.2.8 → 18.3.1로 낮추고, Tailwind v3를 새로 도입해 실제 화면에 반영했다.

## 변경 파일

### 문서
- `docs/guide/design-system-adoption.md` — 2026-09-15 재확인 결과 추가
- `docs/tasks/viewer-editorial-ui/{spec,plan,tasks,test-result,result}.md` — 신규

### 데이터 계층
- `src/lib/viewer/publish-metadata.ts` — `category?`, `series?` optional 필드 추가
- `src/lib/viewer/posts.ts` — `metaDescription`/`category`/`readingMinutes`/`heroImageUrl` 노출, `estimateReadingMinutes`/`extractFirstImageSrc` 유틸 추가
- `src/app/api/viewer/posts/route.ts` — 응답에 `metaDescription` 포함(검색 오버레이용)
- `src/lib/comments/comments.ts` — 세션 사용자도 `authorName`을 편집할 수 있도록 `createComment` 수정(이메일은 항상 세션 값 고정)

### 레이아웃/화면 (신규)
- `src/components/layout/SiteHeader.tsx`(Cmd/Ctrl+K 단축키 포함), `SearchOverlay.tsx`(`@sfood/ui` `CommandPalette`로 구현), `SiteFooter.tsx`
- `src/components/posts/PostCard.tsx`, `Hero.tsx`, `RecentCommentsSidebar.tsx`, `SeriesWidget.tsx` — 커스텀 유지(아래 "주요 결정" 참고)
- `src/app/page.tsx`, `src/app/posts/[slug]/page.tsx` — 위 컴포넌트로 재조립
- `src/components/comments/CommentSection.tsx` — 게이트→확인→작성 3단계 상태 머신, `@sfood/ui`의 `Card`/`Button`/`Input`/`ColorTag`/`CommentThread`로 구현
- `src/app/globals.css` — 목업(`docs/guide/mockups/blog-editorial-direction.html`) 토큰·클래스 이식 + `@sfood/ui` 토큰 import·Tailwind 지시어 추가, 라이브러리 컴포넌트가 대신하게 된 CSS 제거
- `src/app/layout.tsx` — `<html data-theme="light">` 추가(다크모드 오염 방지)

### 빌드 체인 (신규/변경)
- `package.json` — `react`/`react-dom` `19.2.8` → `18.3.1`(exact), `@sfood/ui@0.1.3`(exact) 추가, `@types/react`/`@types/react-dom` 18로 동기화, `tailwindcss`/`postcss`/`autoprefixer` devDependencies 추가
- `tailwind.config.mjs`, `postcss.config.mjs` — 신규(`@sfood/ui`가 raw `@tailwind` 지시어를 배포하므로 소비 측 빌드 필수)

## 주요 결정

1. **실데이터만 사용, 없는 필드는 조건부 생략**: 카테고리(키커)·작성자명·시리즈 상세(회차별 목록)는 `data-spec.md`/현재 구현에 없다. 가짜 값을 넣는 대신 optional로 두고 값이 없으면 화면에서 자연스럽게 빠지도록 만들었다(이미지가 있으면 보너스라는 기존 원칙과 동일 패턴).
2. **카드 썸네일은 목록 화면에서 사용하지 않음**: 목업은 본문에 이미지가 있는 글만 카드에 썸네일을 붙이지만, 홈 목록에서 이를 판단하려면 게시글마다 본문 전체를 추가로 조회해야 해(N+1 Confluence 호출) architecture.md의 "반복 조회 성능" 원칙과 충돌한다. 상세 페이지(단건 조회)에서만 첫 이미지를 추출해 히어로로 쓰고, 목록 카드는 텍스트 전용으로 통일했다.
3. **구독 밴드는 RSS 링크로 대체**: 목업의 이메일 구독 폼은 이 서비스에 없는 기능(백엔드 없음)이라 실제로 존재하는 `/rss.xml`로 안내하는 실제 동작 링크로 바꿨다 — 동작하지 않는 폼을 보여주는 것 자체가 "AI 슬롭" 체크리스트가 경계하는 정직하지 않은 UI이기 때문.
4. **댓글 답글도 동일한 신원으로 처리**: 최초 1회만 게이트를 통과하면 답글 작성 시 다시 신원 확인을 거치지 않는다(design-direction.md "신원은 유지되므로..." 원칙을 답글에도 동일 적용).
5. **"다른 사용자로" 전환 시 실제 로그아웃**: MS 인증 사용자가 전환을 누르면 `next-auth`의 `signOut()`으로 세션을 실제로 끊는다 — 그러지 않으면 서버가 세션 존재만으로 항상 MS 사용자로 처리해 게스트 전환이 실제로는 동작하지 않는 모순이 생기기 때문.
6. **사이드바 "최근 댓글"은 데이터 없이 준비만**: 전체 게시글에 걸친 댓글 집계는 새 백엔드 로직이 필요해 이번 범위에 넣지 않았다. 컴포넌트는 완성해 뒀고 빈 배열이면 렌더링하지 않는다.
7. **`@sfood/ui`는 전면 도입하되 강제로 끼워 맞추지 않았다**: 댓글 게이트/확인 패널·버튼·입력창·검색은 라이브러리로 교체했지만, 홈 카드 그리드(`MediaCard`는 승인된 텍스트 우선 디자인과 시각 충돌)·최근 댓글/관련 글 리스트(`List`의 `primary`/`secondary`가 `string` 고정이라 커스텀 스타일 불가)·키커 라벨(`ColorTag`는 칩 형태라 타이포그래피 정체성과 다름)·마스트헤드/히어로/시리즈 위젯/풀쿼트/콜아웃/구독 밴드/푸터(대응 컴포넌트 없음)는 커스텀으로 유지했다. 근거는 [design-system-adoption.md](../../guide/design-system-adoption.md) "의도적으로 채택하지 않은 부분" 참고.
8. **다크모드 오염 방지**: `@sfood/ui`의 토큰이 방문자 OS 다크 모드 설정을 자동으로 따라가는데, 이 저장소는 단일 라이트 테마이므로 `<html data-theme="light">`로 고정했다 — 실제로 격리 라우트에서 Card가 검게 렌더링되는 것을 발견하고 나서 추가한 수정이다.
9. **벤더 수정 주장을 그대로 믿지 않고 재현했다**: "MCP 수정 완료" 안내를 받은 두 번 모두(1차 MCP만 고쳐졌던 때, 2차 `@sfood/ui@0.1.3` 실제 배포 때) `npm view`/`unpkg` 정적 확인에 그치지 않고 실제로 설치·빌드·브라우저 렌더링까지 검증한 뒤에만 반영했다.

## 검증

- `npm run lint`, `npm run build` 통과
- 브라우저 프리뷰로 홈 화면(빈 상태)·검색 오버레이(`CommandPalette`)·댓글 게이트→확인→작성 전체 흐름(격리 라우트) 확인, 콘솔 에러 없음
- sitemap/rss/robots/404 회귀 없음
- 상세 근거는 [test-result.md](test-result.md) 참고

## 열린 과제(다음 단계로 이관)

- 연결된 Confluence Space에 게시된 문서가 0건이라, 히어로·카드 그리드·상세(시리즈 위젯 포함)는 실제 데이터로 육안 검증하지 못했다(댓글 게이트→확인→작성 흐름은 격리 라우트로 검증함). Editor에서 문서를 하나 게시한 뒤 재확인이 필요하다.
- 사이드바 "최근 댓글"을 실데이터로 채우려면 전체 게시글 댓글을 모아 최신순으로 정렬하는 API/조회 로직이 새로 필요하다.
- `category`/`series`가 실제로 채워지려면 Editor 쪽에서 게시 설정 화면에 해당 입력을 추가하고 `publishMetadata`에 값을 써야 한다(Editor 저장소 작업, 이 저장소 범위 밖).
- `series`에 회차별 slug 목록이 없어 시리즈 위젯이 진행률만 보여주고 회차 목록 펼치기/이전·다음 이동은 아직 구현하지 못했다.
- Confluence `ac:image` 매크로가 `converter.ts`에서 아직 `<img>`로 변환되지 않아, 본문에 이미지를 넣어도 실제로는 상세 히어로가 뜨지 않을 가능성이 높다 — 별도 컨버터 개선 과제로 남긴다.
- PR #1(문서 동기화)에 아직 리뷰어가 지정되지 않은 상태다(이전 요청에서 보류).
- `npm audit`이 보고한 Next.js Critical RCE(수정 버전 16.3.5)는 이번 작업과 무관하게 여전히 미해결이다.
- **React 18 고정에 대한 의존**: `@sfood/ui`의 peerDependencies가 `^18.0.0`으로 고정되어 있어, Next.js/next-auth가 React 19를 다시 채택하더라도 `@sfood/ui`를 계속 쓰는 한 이 저장소는 React 18에 머물러야 한다. `@sfood/ui`가 React 19를 공식 지원하기 전까지는 감수해야 하는 제약이다.
- **`@sfood/ui` 버전을 exact 고정함**: 과거 크래시 이력이 있는 패키지라 `^0.1.3`이 아니라 `0.1.3`으로 정확히 고정했다. 이후 패치 버전이 올라오면(예: `0.1.4`) 자동 반영되지 않으므로, 새 버전이 나오면 이번과 동일하게 격리 라우트에서 먼저 검증한 뒤 수동으로 올려야 한다.
- `MediaCard`/`List`는 API 제약(문자열 전용 슬롯)과 승인된 비주얼 충돌로 이번에 채택하지 않았다 — 추후 두 컴포넌트가 `ReactNode` 슬롯을 지원하도록 개선되면 재검토할 만하다.
