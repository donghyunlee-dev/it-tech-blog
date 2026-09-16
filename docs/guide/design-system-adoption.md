# 사내 디자인 시스템(@sfood/ui) 적용 가능성 검토

## 최종 결론 (2026-09-15) — 채택 완료

**적용함.** 아래 "결론(2026-09-14)"과 "재검토 조건"에 정리했던 3가지 차단 사유(React 19 크래시, `CommentThread` 미배포, 브랜드 컬러 불일치)가 담당팀의 `@sfood/ui@0.1.3` 배포로 모두 해소되었음을 실제 설치·빌드·브라우저 렌더링으로 확인했다. 상세 경과와 실제 반영 내용은 맨 아래 "2026-09-15 최종 확인 및 전면 도입" 절 참고. 아래 2026-09-14 기록은 당시 크래시를 어떻게 진단했는지 보여주는 이력으로 남겨둔다.

## 결론 (2026-09-14, 실제 설치 검증 후 갱신 — 이제는 해결된 과거 기록)

**당시(2026-09-14) 시점에는 적용 불가했다.** 문서 조사 단계에서는 유망해 보였으나, 실제로 `npm install @sfood/ui`를 설치하고 이 저장소(Next.js 16 + React 19.2.8)에서 렌더링을 시도한 결과 **컴포넌트를 import하는 즉시 크래시**하는 것을 확인했다. React 19→18 다운그레이드로도 동일하게 재현되어, 단순한 React 메이저 버전 비호환이 아니라 더 근본적인 원인(패키지 번들링 방식 등)으로 보이며, 애플리케이션 코드 레벨에서 우회할 수 있는 문제가 아니다. 검증에 사용한 코드는 모두 되돌렸고(아래 "진행 경과" 참고), 이 저장소는 현재 `@sfood/ui`를 설치하지 않은, React 19.2.8 기준 정상 빌드 상태다.

- 문서 출처: https://sfood-design-system.vercel.app (Storybook), 패키지: `@sfood/ui` (public npm, 최신 버전 0.1.2, React 18 peer dependency)
- 관련 문서: [design-system.md](design-system.md), [design-benchmark.md](design-benchmark.md)

## 진행 경과

1. **문서 조사(1차)**: Storybook의 `index.json`을 통해 컴포넌트 목록을 확인. 우리가 벤치마킹한 3개 기능(목록/검색/댓글)에 대응하는 `Data/MediaCard`, `Navigation/ChipGroup`, `Overlay/CommandPalette`, `Data/CommentThread`를 찾았고, 토큰이 CSS Variable로 override 가능하다는 점도 확인 — 여기까지는 적용을 권장하는 방향이었다.
2. **설치**: `npm install @sfood/ui` 시도 → **ERESOLVE 실패**. `@sfood/ui@0.1.2`의 peerDependency가 `react@^18.0.0`인데 이 저장소는 `react@19.2.8`을 사용 중이라 충돌. 사용자 확인 후 `--legacy-peer-deps`로 강제 설치 진행.
3. **패키지 원문 확인**: 설치 후 `node_modules/@sfood/ui`의 `tokens/base.css`, `tokens/semantic.css`, `tailwind.config.js`, `dist/index.d.ts`를 직접 열람.
   - **중요 발견**: `--brand-600: #d65050`이 기본 브랜드 색상이며, 주석에 "s-food.co.kr 실제 사이트의 강조색(#d65050, 메뉴/아이콘 hover)을 600 기준으로 앵커해 도출"이라고 명시되어 있다. 반면 우리 [design-system.md](design-system.md)는 `#e4002B`를 "sfood Red"로 정의하고 있다 — **두 값이 다르다.** 어느 쪽이 실제 공식 브랜드 컬러인지는 이 조사만으로 단정할 수 없으나, `@sfood/ui`의 주석은 실제 s-food.co.kr 사이트에서 색을 추출했다고 명시하고 있어 신뢰도가 더 높아 보인다. **브랜드 컬러 재확인이 필요하다** (별도 확인 필요 사항으로 아래에 남김).
   - 라운드(`--radius-card: 12px`)와 그림자(`--shadow-card: 0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.04)`)도 우리 design-system.md의 값(20px, 3-layer 그림자)과 다르다.
   - 폰트는 `--font-sans: 'Inter', system-ui, ...` — 우리가 지정한 맑은고딕/Pretendard가 아니다. Inter는 한글 글리프가 없어 한글 텍스트는 `system-ui`로 폴백된다.
   - **`Data/CommentThread`는 Storybook에는 완전한 동작 예시(작성/답글/빈 상태)가 있지만, 실제 배포된 npm 패키지(`dist/index.d.ts`, `dist/index.js`) 어디에도 존재하지 않는다.** Storybook 배포본과 npm 배포본 사이에 버전 차이가 있는 것으로 보인다 — 즉 우리가 가장 필요로 했던 컴포넌트는 아직 설치할 수 없는 상태다.
4. **실제 렌더링 검증**: 기존 화면에 영향을 주지 않도록 `/design-preview`라는 격리된 라우트(자체 `layout.tsx`에서만 `@sfood/ui/global.css`를 import)를 만들어 `Button`/`MediaCard`/`ChipGroup`/`CommandPalette`(실제 npm 패키지에 존재하는 컴포넌트만)를 렌더링하는 페이지를 작성하고 `npm run dev`로 열어봤다.
   - **결과: 즉시 크래시.** `TypeError: Cannot read properties of undefined (reading 'ReactCurrentDispatcher')` — `@sfood/ui`에서 아무 컴포넌트나 import하는 순간(모듈 평가 시점) 발생하며, 어떤 컴포넌트를 실제로 사용했는지와 무관하다.
   - `npm run build`(프로덕션 빌드)로도 재현: `/design-preview` 페이지를 프리렌더링하는 과정에서 동일한 계열의 에러(`ReactCurrentOwner` 관련)로 **빌드 자체가 실패**했다.
   - 원인 조사: `node_modules/@sfood/ui/dist/index.js`에 `v.ReactCurrentDispatcher`(React 개발 빌드 내부 API)를 직접 참조하는 코드가 들어 있었다. 이는 `@sfood/ui`의 Vite 라이브러리 빌드가 `react`를 외부 의존성(peer, externalized)으로 제대로 분리하지 못하고 React 18 기준 내부 코드 일부를 번들에 인라인한 것으로 보인다. React 19에서는 이 내부 API의 구조가 바뀌었기 때문에, 번들에 박제된 React 18 코드가 런타임에 실제 React 19 인스턴스와 어긋나며 크래시한다. `npm ls react`로 확인한 결과 저장소 내 React는 19.2.8 하나로 정상 dedupe되어 있어 "중복 React 인스턴스" 문제는 아니며, 순수하게 **패키지 자체의 빌드 문제**로 판단된다.
   - 이 문제는 우리 애플리케이션 코드에서 우회할 수 있는 종류가 아니다(barrel import `dist/index.js` 자체가 평가되는 순간 크래시하며, 개별 컴포넌트만 골라 import하는 진입점도 없음). 패키지 쪽에서 React 19 대상으로 다시 빌드/배포해야 해결된다.
5. **롤백**: 빌드 실패를 확인한 즉시 `/design-preview` 라우트, `tailwind.config.mjs`, `postcss.config.mjs`를 삭제하고 `@sfood/ui`/`tailwindcss`/`postcss`/`autoprefixer`를 언인스톨했다. `npm run build`가 다시 정상 통과하는 것까지 확인했다.
6. **React 18 다운그레이드 시도**: "React 19가 원인이라면 React 18로 낮추면 되지 않을까"라는 가설을 검증하기 위해 `react`/`react-dom`을 18.3.1로 낮추고(Next.js `^18.2.0 || 19.x`, next-auth `^18.2.0 || ^19.0.0` 둘 다 React 18을 공식 허용하며, 우리 코드에는 `use()`/`useActionState` 등 React 19 전용 API가 없어 기존 화면은 React 18에서도 정상 빌드됨을 먼저 확인) `@sfood/ui`를 다시 설치했다. 이번에는 peer dependency 충돌 없이 깨끗하게 설치됐다.
   - **결과: 동일하게 크래시.** `npm run build` 시 완전히 같은 에러(`ReactCurrentOwner` 관련)로 `/design-preview` 프리렌더링이 실패했다. `npm ls react`로 React 18.3.1이 트리 전체에서 중복 없이 dedupe되어 있음도 재확인했다 — 즉 **React 18/19 버전 문제가 아니었다.**
   - 이는 원인이 React 메이저 버전 비호환이 아니라 더 근본적인 문제(예: Turbopack의 SSR/프리렌더링 과정에서 `@sfood/ui`의 ESM 번들을 처리하는 방식, 또는 패키지 자체의 번들링 방식)임을 시사한다. 정확한 원인은 이 저장소 쪽에서 더 파고들 수 있는 범위를 넘어섰다고 판단해 조사를 중단했다.
   - **다운그레이드도 원복**: `react@19.2.8`/`react-dom@19.2.8`/`@types/react`/`@types/react-dom`을 원래 버전으로 되돌리고, `@sfood/ui`/`tailwindcss`/`postcss`/`autoprefixer`를 다시 언인스톨했다. `npm run build` 정상 통과 및 `package.json`이 원본과 동일함(`git diff` 무변경)을 확인했다.

**따라서 React 버전을 낮춰서 맞추는 우회로도 통하지 않는다.** 문제는 React 18 vs 19가 아니라 그보다 근본적인 곳에 있다.

## 남은 확인 사항 (design-system-adoption 자체와 무관하게 발견한 것들)

- **브랜드 컬러**: `#e4002B`(우리 design-system.md) vs `#d65050`(`@sfood/ui` 기본값, 실사이트 추출 주석 있음) — 실제 공식 브랜드 컬러가 무엇인지 사내 디자인 시스템 담당자에게 확인 필요.
- **보안(무관한 발견)**: `npm audit` 결과 이 저장소에는 `@sfood/ui`와 무관하게 **Next.js 16.0.0~16.3.2의 Critical 취약점(인증되지 않은 원격 코드 실행, Windows 호스팅 서버 대상 + AVIF 이미지 최적화 API 경유)**이 이미 존재한다(`next@16.3.0` 사용 중, 수정 버전 `16.3.5` 존재). 이번 작업과 무관하게 별도로 다뤄야 할 사안이다.

## 재검토 조건

다음 중 하나가 해소되면 다시 검토할 가치가 있다.

1. `@sfood/ui` 메인터너가 이번에 재현한 크래시(React 18/19 양쪽에서 동일 재현, `/design-preview`·React 다운그레이드 재현 절차 포함)를 원인 분석해 새 버전을 배포한다.
2. `Data/CommentThread`가 실제 npm 패키지에 포함되어 배포된다.
3. 브랜드 컬러(`#e4002B` vs `#d65050`) 불일치가 해소된다.

그 전까지는 기존에 만든 정적 목업([mockups/blog-ui-benchmark.html](mockups/blog-ui-benchmark.html))과 손으로 정의한 CSS 토큰([design-system.md](design-system.md))으로 계속 진행하고, 이 저장소의 `src/app/globals.css`(순수 CSS, Tailwind 미사용)를 유지한다.

## 2026-09-15 재확인 (MCP 서버 수정 이후)

"MCP를 수정 중"이라는 안내에 따라 실제 화면 구현([viewer-editorial-ui/spec.md](../tasks/viewer-editorial-ui/spec.md)) 착수 전 재검토 조건 3가지를 다시 확인했다.

- **MCP 서버 자체는 정상 동작한다**: `https://sfood-design-system.vercel.app/api/mcp`에 `initialize`/`search_components`/`get_component`를 호출하면 정상 응답하며, `CommentThread`가 메타데이터(설명·`usageSnippet`)에 나타난다.
- **그러나 실제 npm 패키지는 그대로다**: `npm view @sfood/ui version peerDependencies` 결과 여전히 `0.1.2`/`react@^18.0.0`이고, `unpkg.com/@sfood/ui@0.1.2/dist/index.js`에 크래시 원인이었던 `ReactCurrentDispatcher` 참조가 그대로 남아 있다. `dist/index.d.ts`·`dist/index.js`에서 `CommentThread`를 검색하면 0건 — Storybook/MCP 메타데이터에만 존재하고 실제로는 배포되지 않은 상태가 여전하다.
- **결론**: MCP(메타데이터 조회 서버)와 `@sfood/ui`(실제 배포 패키지)는 별개다. 이번에 고쳐진 것은 전자뿐이며, 우리가 막혀 있던 원인(React 19 크래시, `CommentThread` 미배포, 브랜드 컬러 불일치)은 하나도 해소되지 않았다. **재검토 조건 미충족 — 이번 화면 구현에서도 `@sfood/ui`는 사용하지 않고, 기존처럼 `design-system.md`/`design-direction.md`의 자체 CSS 토큰으로 진행한다.**

## 2026-09-15 최종 확인 및 전면 도입

같은 날 늦게 담당팀이 `@sfood/ui@0.1.3`을 배포했다는 안내(수정 내역 6개 항목)를 받았다. 지난번 "MCP만 고쳐졌다"는 낙관하지 않고 다시 각 항목을 직접 재현·확인했다.

1. **React 19 크래시**: `npm view` 기준 버전이 `0.1.3`으로 실제로 올라갔고(`time.modified`가 확인 당일로 갱신됨), `unpkg`의 `dist/index.js`에서 크래시 원인이었던 `ReactCurrentDispatcher` 문자열이 완전히 사라졌다(0건). **실제로 이 저장소에 React 18.3.1 + `@sfood/ui@0.1.3`을 설치하고, `/design-preview`라는 격리 라우트에서 `Button`/`ColorTag`/`Highlight`/`MultiSelect`/`CommentThread`를 렌더링해 `npm run build`(정적 프리렌더 포함)와 브라우저 런타임 양쪽에서 크래시 없이 정상 동작하는 것을 직접 확인했다.**
2. **버전/peerDependencies**: `0.1.3`, `react`/`react-dom` `^18.0.0` 유지 확인.
3. **컴포넌트 불일치**: `unpkg`의 `dist/index.d.ts`·`dist/index.js`에서 `CommentThread`/`ColorTag`/`Highlight`/`MultiSelect` 4개 모두 실제로 존재함을 확인(이전에는 4개 다 0건이었음).
4. **다크모드 토큰**: MCP `get_tokens`에 `theme` 파라미터가 실제로 추가되어 `dark` 요청 시 `--color-surface: gray-900`, `--color-foreground: gray-50` 등 다른 값을 정확히 반환함을 확인. 다만 실제 배포된 `tokens/semantic.css`에는 `@media (prefers-color-scheme: dark)`와 `[data-theme="dark"]` 선택자로 다크 토큰이 이미 내장되어 있어, 이 저장소처럼 라이트 테마만 쓰는 서비스는 방문자 OS가 다크 모드일 때 의도치 않게 다크 톤이 섞이지 않도록 `<html data-theme="light">`를 명시해야 한다(실제로 이 문제를 겪고 수정함 — 아래 참고).
5. **브랜드 컬러**: `get_tokens`(`group: base`) 기준 `--brand-600: #d65050` 그대로. 담당팀 안내대로 `#e4002B`를 하드코딩하지 않고 `--color-brand` 토큰을 참조하도록 이 저장소의 CSS를 수정했다(아래 참고).
6. **폰트**: `get_tokens`(`group: base`)의 `--font-sans`가 `'Pretendard Variable', ...`로 바뀐 것을 확인. `@modelcontextprotocol/sdk`도 `package.json`의 `dependencies`가 아니라 `devDependencies`로 이동되어 있어 런타임 의존성에서 빠졌음을 확인.

**결정: 전면 도입.** React를 18.3.1로 낮추고, Tailwind(v3, `@sfood/ui`의 preset 사용)를 새로 도입해 실제 화면에 반영했다.

- **댓글 게이트 흐름**([CommentSection.tsx](../../src/components/comments/CommentSection.tsx)): 게이트/신원확인 패널의 박스(`Card`)·버튼(`Button`)·입력창(`Input`)·인증 배지(`ColorTag`), 신원 확인 후 댓글 목록·작성창(`CommentThread`)을 `@sfood/ui`로 교체했다. 게이트/확인 단계 전환 로직(순서에 따라 화면이 실제로 바뀌는 것) 자체는 그대로 우리 코드가 담당한다.
- **검색**([SearchOverlay.tsx](../../src/components/layout/SearchOverlay.tsx)): 커스텀 오버레이를 `CommandPalette`로 교체했다. 다만 `CommandItem.label`이 `string` 고정이라 검색어 인라인 하이라이트(`Highlight`/`highlightMatches`)는 이 화면에 적용할 수 없어 사용하지 않는다.
- **토큰**: `globals.css`가 `@sfood/ui/tokens/base.css`·`semantic.css`를 import하고, 브랜드 컬러·폰트만 `var(--color-brand)`/`var(--font-sans)`로 교체했다. 라운드 스케일(8/14/20/32px)·3-layer 그림자 등 에디토리얼 레이아웃 리듬은 별도로 승인된 값이라 그대로 유지한다(아래 "의도적으로 채택하지 않은 부분" 참고).
- **다크모드 오염 방지**: `layout.tsx`의 `<html>`에 `data-theme="light"`를 추가해, `@sfood/ui` 컴포넌트가 방문자 OS의 다크 모드 설정을 따라가 우리 자체 라이트 전용 CSS와 톤이 어긋나는 문제를 막았다.

### 의도적으로 채택하지 않은 부분 (전면 도입이지만 강제로 끼워 맞추지 않은 것들)

- **PostCard(홈 카드 그리드)**: `MediaCard`는 그림자+둥근 박스 형태라, 이미 승인된 "얇은 상단 보더 구분선"의 텍스트 우선 목록 디자인(design-direction.md)과 시각적으로 충돌한다. 강제로 바꾸면 approved 디자인을 훼손하므로 커스텀 구현을 유지했다.
- **RecentCommentsSidebar/관련 글 리스트**: `List`의 `primary`/`secondary`가 `string` 고정이라, 우리가 쓰는 인용부호 스타일링·호버 컬러 전환·키커 배치 같은 커스텀 마크업을 넣을 수 없어 채택하지 않았다.
- **키커(kicker) 라벨**: `ColorTag`는 배경이 있는 칩(pill) 형태라, 우리 키커의 "제목과 한 세트로 읽히는 타이포그래피" 정체성과 다르다. 대신 `ColorTag`는 댓글 신원 확인 화면의 "✓ 인증됨" 배지에는 자연스럽게 맞아 그쪽에만 사용했다.
- **마스트헤드/히어로/시리즈 위젯/풀쿼트/콜아웃/구독 밴드/푸터**: `@sfood/ui`는 사내 업무 도구용 디자인 시스템이라 이런 에디토리얼 매거진 전용 요소에 대응하는 컴포넌트가 애초에 없다. 계속 커스텀으로 유지한다.

### 남은 확인 사항

- 브랜드 컬러가 `#e4002B`(과거 자체 정의)가 아니라 `#d65050`(`@sfood/ui` 공식 토큰)로 확정되었다는 점을 사내 다른 채널(인쇄물, 명함 등)과도 맞출 필요가 있는지는 별도 확인 필요.
- `npm audit`이 보고한 Next.js Critical RCE(수정 버전 16.3.5)는 이번 작업과 무관하게 여전히 미해결이다.
