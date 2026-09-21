# plan — 읽기 경험 개선 실행 계획

각 항목을 독립 PR로 진행한다(리뷰 단위 최소화, 기존 작업 방식 유지).

## Phase A — 헤더 고정 + TOC 활성 표시 버그 (항목 1, 2)

- `globals.css`: `.slim-header`에 `position: sticky; top: 0; z-index: 10; background: var(--surface);` + 스크롤 시 내용과 겹치지 않도록 하단 구분선 유지. 헤더 높이를 실측해 `.toc`의 `top` 값과 헤딩 `scroll-margin-top`을 그 높이 + 여백만큼 맞춘다(그래야 앵커 점프 시 헤딩이 고정 헤더에 가려지지 않는다).
- `TableOfContents.tsx`: TOC 링크 클릭 시 `onClick`에서 즉시 `setActiveId(heading.id)`로 낙관적 갱신 — 스크롤 기반 감지가 따라잡기 전까지 클릭한 항목이 바로 active로 보이게 한다. 이후 자연스러운 스크롤에서는 기존 로직이 이어받는다.

## Phase B — 코드 블록 디자인 개선 (항목 3)

- `converter.ts`: `highlightCode`가 만드는 `<pre>`에 `data-lang="{언어}"` 속성을 남긴다(라벨용). 최종 HTML을 만드는 마지막 단계에 `wrapCodeBlocks()`를 추가해, 매크로/네이티브 상관없이 모든 `<pre>...</pre>`를 `<div class="code-block"><div class="code-block-header"><span class="code-block-lang">{언어 or "CODE"}</span><button type="button" class="code-block-copy" data-code-copy>복사</button></div><pre>...</pre></div>`로 감싼다.
- 새 클라이언트 컴포넌트(`CodeCopyButtons.tsx` 등): 문서 레벨 클릭 이벤트 위임으로 `[data-code-copy]` 클릭을 감지해 인접 `<pre>`의 텍스트를 클립보드에 복사, 버튼 라벨을 잠깐 "복사됨"으로 바꾼다. `.article-body`는 `dangerouslySetInnerHTML` 정적 문자열이라 개별 버튼에 React 핸들러를 못 붙이므로 이벤트 위임이 필요하다.
- `globals.css`: 코드 창 헤더바(연한 배경, 언어 라벨 pill, 복사 버튼) + 코드 본문 톤을 콜아웃/인용문과 구분되게(더 어둡거나 뚜렷한 톤) 조정.

## Phase C — 콜아웃 디자인 개선 (항목 4)

- `globals.css`: `.viewer-panel*`의 `border-left` 전부 제거. `.viewer-panel strong::before`(현재 이모지 아이콘)를 원형 배지 형태로 스타일링(자체 배경색+라운드+패딩), 카드 배경 톤은 유지. 마크업 변경 없이 CSS만으로 가능.

## Phase D — 표 전체 폭 회귀 수정 (항목 5)

- `converter.ts`의 `convertTables`: 여는 태그만 바꾸던 것을 전체 `<table>...</table>` 블록을 잡아 `<div class="viewer-table-wrap">...</div>`로 감싸도록 변경.
- `globals.css`: `table.viewer-table`에서 `display:block`/`overflow-x:auto` 제거(정상 `display:table`로 복귀, `width:100%`는 유지). 가로 스크롤은 새 `.viewer-table-wrap`(`overflow-x:auto`)이 담당.

## Phase E — 히어로 이미지 개선 (항목 6)

- 벤치마크: Medium/velog/Ghost 테마 계열은 대부분 커버 이미지를 고정 비율 배너로 잘라 보여준다(원본 비율 유지 X). `object-fit:cover` + 고정 `aspect-ratio`가 가장 무난한 선택 — 세로 사진도 화면을 안 밀어내고, 가로로 넓은 스크린샷도 잘리지 않을 만큼 낮은 비율을 고른다.
- `globals.css`: `.article-hero`에 `aspect-ratio: 2.4 / 1` 부여, `.article-hero img`를 `position:absolute; inset:0; object-fit:cover`로 변경. 배경색(`var(--surface-muted)`)은 이미지 로딩 전/투명 PNG 대비용으로 유지.
- 본문 안에 같은 이미지가 다시 나오는 경우(현재 구조상 히어로=본문 첫 이미지 재사용)는 그대로 원본 비율로 보이므로, 독자가 원본을 못 보는 손실은 없다.

## 작업 순서

Phase A → B → C → D → E. B(코드 블록)가 가장 크므로 별도로 충분히 검증한다.
