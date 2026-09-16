# test-result — Viewer 에디토리얼 매거진 UI 적용

## 실행한 검증

| 항목 | 명령/방법 | 결과 |
|---|---|---|
| Lint | `npm run lint` | 통과 (경고 없음) |
| 빌드/타입체크 | `npm run build` | 통과 — 모든 라우트 정상 생성(`/`, `/posts/[slug]`, `/sitemap.xml`, `/rss.xml`, `/robots.txt` 등) |
| MCP/`@sfood/ui` 재검토 | `curl`로 MCP `initialize`/`search_components`/`get_component` 호출, `npm view`/`unpkg`로 실 배포 패키지 확인 | MCP 메타데이터 서버는 정상 응답하지만 `@sfood/ui@0.1.2` 자체는 변경 없음(React 19 크래시 원인·`CommentThread` 미배포 그대로) — spec.md에 근거 기록 |
| 홈 화면 렌더링 | `npm run dev` + 브라우저 프리뷰(`http://localhost:57427/`) | 마스트헤드·레드 룰·구독 밴드(RSS 링크)·푸터가 의도대로 렌더링됨. 연결된 Confluence Space에 게시된 문서가 0건이라 "아직 게시된 문서가 없습니다" 빈 상태로 정상 표시(회귀 아님, 실제 데이터 상태) |
| 검색 오버레이 | 브라우저에서 검색 아이콘 클릭 → 오버레이 열림/닫힘, 포커스 시 밑줄 레드로 전환 확인 | 정상 동작, 콘솔 에러 없음 |
| sitemap/rss/robots 회귀 확인 | `curl /sitemap.xml`, `/rss.xml`, `/robots.txt` | 기존과 동일하게 정상 응답(회귀 없음) |
| 404(미게시 slug) | `/posts/does-not-exist` 접근 | 기존과 동일하게 Next.js 기본 404 처리(회귀 없음, 이번 작업으로 변경되지 않음) |

## 검증하지 못한 것과 이유

- **히어로/카드 그리드/상세 페이지(시리즈 위젯 포함)/댓글 3단계 흐름의 실제 화면 확인**: 연결된 Confluence Space에 게시된 문서가 현재 0건이라 실제 데이터로 렌더링해 볼 수 없었다. 테스트용 문서를 실제 Confluence Space에 게시해 확인하는 방법도 있지만, 이는 실 서비스 데이터에 쓰기 작업을 하는 것이라 이번 작업 범위에서 임의로 수행하지 않았다(민감정보 아님 + 되돌릴 수 있는 작업이지만, 별도 승인 없이 운영 데이터에 손대지 않는다는 원칙에 따름).
  - 대신 코드 리뷰로 확인한 것: (1) `globals.css`의 클래스명이 `docs/guide/mockups/blog-editorial-direction.html`과 1:1로 대응해 목업에서 이미 육안 검증된 시각 결과와 동일하게 렌더링될 것으로 예상됨, (2) `CommentSection.tsx`의 stage 전이가 `switch`형 조건부 렌더링(`{stage === "..." && (...)}`)이라 이전 단계 JSX가 실제로 트리에서 사라짐(hidden 속성이 아님) — design-direction.md의 "실제로 DOM에서 숨겨짐" 요구를 코드 구조로 충족.
  - Editor에서 실제 문서를 게시한 뒤 재확인이 필요하다(다음 단계로 이관).
- **AX Auth 실제 리다이렉트 왕복 확인**: `loginUrl` 생성 자체는 기존 로직을 그대로 재사용했고(수정하지 않음), 실제 마이크로소프트 로그인 왕복은 사내 계정과 실제 브라우저 세션이 필요해 이번 자동 검증에서 수행하지 않았다(기존에도 별도 태스크에서 검증된 경로).
- **`signOut()` 기반 "다른 사용자로" 전환**: 로컬에 실제 로그인 세션을 만들기 어려워(AX Auth 왕복 필요) 실제 클릭 검증은 하지 못했다. `next-auth/react`의 `signOut()`은 SessionProvider 없이도 동작하는 표준 API 호출이라 타입 체크와 빌드로 컴파일 오류가 없음만 확인했다.

## 추가 검증 (2026-09-15, `@sfood/ui@0.1.3` 전면 도입)

| 항목 | 명령/방법 | 결과 |
|---|---|---|
| 패키지 정적 확인 | `npm view @sfood/ui version peerDependencies time`, `unpkg` `dist/index.js`/`dist/index.d.ts` 직접 조회 | 버전 `0.1.3`, 배포일 확인 당일 갱신, 크래시 시그니처(`ReactCurrentDispatcher`) 0건, `CommentThread`/`ColorTag`/`Highlight`/`MultiSelect` 4개 모두 실존 확인 |
| React 다운그레이드 | `npm install react@18.3.1 react-dom@18.3.1 --save-exact` 후 `npm ls react react-dom` | 트리 전체 18.3.1로 정상 dedupe, 충돌 없음 |
| `@sfood/ui` 설치 | `npm install @sfood/ui@0.1.3 --save-exact` | ERESOLVE 없이 깨끗하게 설치(0.1.2 때와 달리 peer 충돌 없음) |
| Tailwind 도입 | `tailwind.config.mjs`(preset 확장)·`postcss.config.mjs` 신규 작성 | `npm run build`로 정상 컴파일 확인 |
| **결정적 검증: 실제 렌더링** | 격리 라우트 `/design-preview`(검증 후 삭제)에서 `Button`/`ColorTag`/`Highlight`/`MultiSelect`/`CommentThread` 렌더링, `npm run build`(정적 프리렌더 포함) + 브라우저 스크린샷/콘솔 확인 | **크래시 없이 정상 렌더링.** 지난번(0.1.2) 크래시가 재현되지 않음을 직접 확인 — 벤더 주장을 그대로 신뢰하지 않고 실제로 검증함 |
| 다크모드 오염 발견 및 수정 | 위 격리 라우트에서 `Card` 배경이 검게 렌더링되는 것을 발견 → 원인 분석(`@sfood/ui/tokens/semantic.css`의 `prefers-color-scheme: dark` 미디어쿼리가 브라우저 환경의 다크 선호도를 따라감) → `layout.tsx`에 `<html data-theme="light">` 추가 → 재검증 | 수정 후 흰 배경으로 정상 렌더링 확인 |
| 댓글 게이트 흐름 클릭 검증 | 격리 라우트에서 게이트 → "이름으로 계속하기" → `Input`에 이름/이메일 입력 → "확인하고 댓글 작성" → `CommentThread` 작성창에 텍스트 입력 → "댓글 등록" 클릭 → "다른 사용자로" 클릭 | 각 단계가 순서대로만 나타남(이전 단계 DOM 제거) 확인. 실제 `/api/comments` POST가 나가 Confluence가 가짜 pageId를 거부하는 정상 실패 응답(`400 Bad Request`)까지 확인 — 목업이 아니라 실 API 연동임을 증명 |
| 버그 발견 및 수정 | 위 클릭 검증 중 발견 | 댓글 목록 조회 실패(`loadError`) 시 `CommentThread` 자체가 렌더링되지 않아 신원 확인을 마쳐도 작성창이 안 뜨는 버그 발견 → 목록 조회 실패와 무관하게 작성창은 항상 뜨도록 조건 수정 |
| 최종 lint/build | `npm run lint`, `rm -rf .next && npm run build` | 둘 다 통과, 경고 없음 |
| 홈 화면 회귀 확인 | 실 서비스(Confluence 연동, 게시글 0건) 브라우저 프리뷰 | 시각적 회귀 없음, 콘솔 에러 없음 |

## 재검토(AI 슬롭 체크리스트)

design-direction.md에 이미 기록된 체크리스트(장식용 그라데이션·균일한 크기·반응 없는 호버·모호한 카피) 기준으로 새로 추가한 코드를 점검했다: 새 CSS에 그라데이션 없음, `.post-card`/`.hero`/`.recent-item`/`.related-card`/`.search-result-row`에 호버 상태 있음, 라운드 스케일 유지(8/14/20/32px 혼용), 카피는 실제 기능 설명(예: "RSS로 구독하면 새 글이 올라올 때마다 리더에서 바로 확인할 수 있습니다") — 위반 없음.
