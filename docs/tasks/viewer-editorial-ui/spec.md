# spec — Viewer 에디토리얼 매거진 UI 적용

## 문제 정의

`docs/guide/design-direction.md`에서 확정한 "에디토리얼 매거진형" 디자인 방향과 `docs/guide/mockups/blog-editorial-direction.html` 정적 목업이 준비되어 있으나, 실제 Next.js 앱(`src/app/page.tsx`, `src/app/posts/[slug]/page.tsx`, `src/components/comments/CommentSection.tsx`)은 여전히 최소 스타일(`globals.css`의 기본 카드/리스트)만 적용된 상태다. 이 작업은 목업의 디자인 언어를 실제 화면 컴포넌트로 이식한다.

## 사전 확인: `@sfood/ui` MCP 재검토 결과 (2026-09-15)

작업 착수 전 `docs/guide/design-system-adoption.md`의 "재검토 조건"을 다시 확인했다.

- MCP 서버(`https://sfood-design-system.vercel.app/api/mcp`)는 정상 응답하며 `CommentThread`가 `search_components`/`get_component` 메타데이터에 나타난다.
- 그러나 **실제 배포된 npm 패키지(`@sfood/ui@0.1.2`)는 변경되지 않았다**: `npm view` 기준 버전·`peerDependencies`(`react@^18.0.0`) 그대로이고, `unpkg`로 받은 `dist/index.js`에 크래시 원인이었던 `ReactCurrentDispatcher` 참조가 그대로 남아 있으며, `dist/index.d.ts`/`dist/index.js` 어디에도 `CommentThread`가 실제로는 존재하지 않는다(0건).
- 즉 **MCP 메타데이터 서버만 갱신되었을 뿐, 우리가 막혀 있던 실제 원인(React 19 크래시, `CommentThread` 미배포)은 그대로다.** 재검토 조건 3가지(패키지 재배포, `CommentThread` 배포, 브랜드 컬러 정합) 중 어느 것도 해소되지 않았다.
- **결정(당시)**: 이번 작업에서도 `@sfood/ui`는 사용하지 않는다. 기존처럼 `design-system.md`/`design-direction.md`가 정의한 자체 CSS 토큰(순수 CSS, `globals.css`)으로 구현한다. `design-system-adoption.md`에 이 재확인 결과를 추가한다.

## 추가 확인 및 범위 변경: `@sfood/ui@0.1.3` 전면 도입 (2026-09-15, 같은 날 갱신)

위 확인 직후 담당팀이 `@sfood/ui@0.1.3`을 배포했다는 수정 내역(React 19 크래시 수정, `CommentThread`/`ColorTag`/`Highlight`/`MultiSelect` 실제 배포, MCP `get_tokens` 다크모드 `theme` 파라미터, 브랜드 컬러/폰트 토큰 정리, MCP SDK를 런타임 의존성에서 제외)을 전달받았다. "MCP만 고쳐졌다"던 지난 확인의 재발을 막기 위해 이번에도 직접 재검증했다.

- `npm view @sfood/ui version` → `0.1.3`, 배포일이 확인 당일로 갱신됨을 확인.
- `unpkg`의 `dist/index.js`에서 크래시 원인 `ReactCurrentDispatcher` 문자열이 사라졌고, `CommentThread`/`ColorTag`/`Highlight`/`MultiSelect` 4개 모두 `dist`에 실제로 존재함을 확인.
- **결정적 검증**: 이 저장소에 실제로 React 18.3.1 + `@sfood/ui@0.1.3`을 설치하고 격리 라우트(`/design-preview`, 검증 후 삭제)에서 `Button`/`ColorTag`/`Highlight`/`MultiSelect`/`CommentThread`를 렌더링해 `npm run build`(정적 프리렌더 포함)와 실제 브라우저 런타임 양쪽에서 크래시 없이 동작함을 확인했다.
- 사용자 확인(AskUserQuestion)을 거쳐 **전면 도입**(React 18 다운그레이드 + Tailwind 도입 + 가능한 모든 화면 요소를 `@sfood/ui` 컴포넌트로 재구성)을 선택했다.

### 변경된 범위

- 위 "범위(In Scope)" 5개 항목은 그대로 유효하되, 아래와 같이 구현 수단이 바뀐다.
  - 댓글 게이트/확인 패널의 박스·버튼·입력창·인증 배지 → `@sfood/ui`의 `Card`/`Button`/`Input`/`ColorTag`.
  - 신원 확인 후 댓글 목록·작성창 → `@sfood/ui`의 `CommentThread`(게이트/확인 단계 전환 로직 자체는 이 저장소 코드가 계속 담당).
  - 검색 오버레이 → `@sfood/ui`의 `CommandPalette`.
  - 브랜드 컬러(`--brand-red` 등)·폰트(`body` font-family) → `@sfood/ui`의 공식 토큰(`--color-brand`, `--font-sans`)을 참조하도록 변경. 하드코딩된 `#e4002B` 값은 제거.
- **의도적으로 라이브러리를 쓰지 않는 부분**(강제로 끼워 맞추지 않음, 근거는 [design-system-adoption.md](../../guide/design-system-adoption.md) "의도적으로 채택하지 않은 부분" 참고): 홈 카드 그리드(`MediaCard`는 승인된 텍스트 우선 디자인과 시각적으로 충돌), 최근 댓글/관련 글 리스트(`List`의 `primary`/`secondary`가 `string` 고정이라 커스텀 인용부호·키커 스타일을 넣을 수 없음), 키커 라벨(`ColorTag`는 칩 형태라 타이포그래피 정체성과 다름 — 대신 댓글 신원 확인의 "인증됨" 배지에는 사용함), 마스트헤드/히어로/시리즈 위젯/풀쿼트/콜아웃/구독 밴드/푸터(대응 컴포넌트 자체가 없음).
- **새로 추가되는 의존성/빌드 체인**: React 19.2.8 → 18.3.1 다운그레이드(코드에 19 전용 API 미사용 확인됨), Tailwind v3 + PostCSS 도입(`@sfood/ui`가 `@tailwind` 지시어가 포함된 raw CSS를 배포하므로 소비 측에서 반드시 빌드해야 함), `<html data-theme="light">` 추가(방문자 OS 다크 모드 설정이 `@sfood/ui` 컴포넌트에만 적용되어 우리 자체 라이트 전용 CSS와 톤이 어긋나는 것을 방지).

## 범위 (In Scope)

1. `globals.css`에 목업에서 쓰인 추가 토큰(브랜드 틴트, 3단계 텍스트 톤, muted 서페이스, hairline 보더, 32px 라운드, 호버 트랜지션)을 병합.
2. 공통 레이아웃: 헤더(유틸리티 바 + 홈 전용 마스트헤드 + 상세 전용 슬림 sticky 헤더) · 검색 오버레이(실 게시글 제목 기준 클라이언트 검색) · 푸터(구독 콜아웃 밴드 + 링크 컬럼, 기존 `RELATED_SITES`/`rss.xml` 재사용).
3. 홈 화면: 마스트헤드 + 히어로(최신 글 1건, 사진 없이 타이포+색 배경) + 텍스트 우선 카드 그리드(나머지 글) + 사이드바(구조만 준비, "최근 댓글" 데이터는 Out of Scope) + 푸터.
4. 상세 화면: 슬림 헤더 + 키커(카테고리 데이터 없으면 생략) + 제목 + 바이라인(작성일 + 예상 읽기 시간 — 아바타/작성자명 없음) + 히어로(본문에 실제 `<img>`가 있을 때만, 첫 이미지 추출) + 시리즈 위젯(시리즈 메타데이터 있을 때만, 현재는 없으므로 렌더 안 됨) + 본문(리드 문단 강조, 풀쿼트/콜아웃 스타일) + 관련 글(텍스트 리스트) + 푸터.
5. 댓글: `design-direction.md`의 "댓글 작성 프로세스" 결정(게이트→확인→작성 3단계, 이전 단계는 실제로 DOM에서 사라짐)을 실제 `/api/comments` API와 실제 AX Auth 세션에 연결해 재구현. MS 로그인 사용자도 이름을 수정할 수 있어야 한다는 기존 결정(2026-09-14)을 반영해 `authorName`을 세션 사용자에게도 허용하도록 `createComment`를 확장한다(이메일은 항상 세션 값 고정).

## Out of Scope

- 사이드바 "최근 댓글" 실데이터: 전체 게시글에 걸친 댓글 집계 API가 없다. 새 백엔드 조회 로직이 필요한 별도 과제이므로, 이번에는 컴포넌트만 준비하고 빈 배열을 전달한다(섹션 자체는 데이터가 없으면 렌더링하지 않음).
- 카테고리(kicker)·태그·시리즈 실데이터 입력: `data-spec.md`의 `Publish Metadata`에 필드가 없다. `PublishMetadata`(Viewer 자체 타입)에 optional 필드(`category?`, `series?`)만 추가해 두되, Editor가 실제로 이 값을 채워 넣기 시작하기 전까지는 화면에 나타나지 않는다. Editor 저장소 변경이나 `docs/product/data-spec.md`(공유 계약 문서) 수정은 이번 작업에 포함하지 않는다.
- 댓글 알림 메일의 `login_token` 신선도 확보(PRD에 이미 별도 과제로 명시됨) — 손대지 않는다.
- ~~`@sfood/ui` 재설치 시도~~ → 2026-09-15 같은 날 재검토 조건이 해소되어 전면 도입으로 범위가 바뀌었다. 위 "추가 확인 및 범위 변경" 참고.

## 사용자 시나리오

- 방문자가 홈에 접속하면 마스트헤드·히어로·카드 그리드를 텍스트 중심으로 본다(이미지 없는 글이 대부분이어도 어색하지 않음).
- 방문자가 상세 페이지에서 글을 읽다가 댓글을 남기려 하면, 댓글창이 먼저 보이지 않고 "먼저 작성자를 확인해달라"는 게이트만 보인다.
- 사내 직원이 "MS 계정으로 인증"을 누르면 실제 AX Auth로 리다이렉트되고, 돌아오면 이메일이 잠긴 채 이름은 제안값(이메일 로컬파트)으로 채워진 확인 화면이 바로 보인다(게이트를 다시 거치지 않음).
- 외부 방문자가 "이름으로 계속하기"를 누르면 이름·이메일 입력 화면이 나오고, 비어 있으면 통과하지 못한다.
- 확인이 끝나야만 댓글 입력창이 나타나고, 등록하면 목록 맨 위에 즉시 추가된다.

## 수용 기준

- [ ] 홈/상세 화면이 `design-direction.md`의 헤더·히어로·그리드·상세 구성을 반영한다.
- [ ] 실제 데이터(제목/날짜/본문/관련 글)만 사용하며, 존재하지 않는 필드(카테고리/작성자명/시리즈)는 조건부로 생략된다(가짜 값 없음).
- [ ] 댓글 위젯은 로그인 전 입력창이 보이지 않고, 3단계(게이트→확인→작성) 중 한 번에 하나만 화면에 존재한다(`hidden`이 아니라 실제로 해당 단계 컴포넌트가 렌더링되지 않음).
- [ ] MS 로그인 사용자도 댓글 작성자 이름을 수정할 수 있다(이메일은 세션 값으로 고정).
- [ ] `npm run build`가 통과한다.
- [ ] 925studios "AI 슬롭" 체크리스트(장식용 그라데이션·균일한 크기·반응 없는 호버·모호한 카피) 재점검을 통과한다.
- [ ] `@sfood/ui@0.1.3`이 실제로 크래시 없이 렌더링됨을 격리 라우트에서 확인한 뒤 반영한다(빌드 성공만으로 판단하지 않는다).
- [ ] 브랜드 컬러·폰트가 `#e4002B` 하드코딩이 아니라 `@sfood/ui`의 `--color-brand`/`--font-sans` 토큰을 참조한다.
- [ ] `<html data-theme="light">`로 방문자 OS 다크 모드 설정이 `@sfood/ui` 컴포넌트에만 적용되는 톤 불일치를 막는다.

## 엣지 케이스

- 게시글이 0개: 기존처럼 빈 상태 안내 유지, 히어로/그리드 렌더링 생략.
- 게시글이 1개뿐: 히어로만 있고 그리드는 빈 상태.
- 본문에 이미지가 여러 개: 첫 번째 `<img>`만 히어로로 추출.
- 댓글 목록 로딩 실패: 기존 에러 문구 유지.
- 게스트가 이름/이메일 없이 "확인" 시도: 통과하지 못하고 무엇이 빠졌는지 안내(클라이언트 검증 + 서버 `ValidationError` 이중 방어, 기존 서버 검증 유지).

## 가정

- `data-spec.md`/`PublishMetadata` 확장은 Viewer 쪽에서 optional 필드를 추가하는 것만 허용되며(하위 호환), Editor 쪽 실제 반영은 이 저장소 범위 밖이다.
- `next-auth`의 `signOut()`으로 세션을 끊는 것이 "다른 사용자로" 전환(MS 로그인 사용자 한정)에 사용 가능하다.
