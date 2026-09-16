# spec — Confluence 본문 요소(제목/목록/인용문 등) 스타일 복구

## 문제 정의

실제 게시된 문서("Gemini에 SFOOD 업무 지침 설정하기")를 상세 페이지에서 직접 확인한 결과, 소제목(`<h2>`)·글머리 목록(`<ul><li>`)·인용문(`<blockquote>`)이 전부 본문 문단과 구분되지 않는 **평평한(flat) 모양으로 깨져 있었다.** 사용자가 "분명 안티패턴을 제외시켰는데 다시 나오는 것 같다"고 지적한 것이 바로 이 증상이다 — 크기·강조가 전혀 구분되지 않는 균일한 모양은 925studios AI 슬롭 체크리스트의 "uniform sizing" 항목과 본질이 같다.

## 원인

2026-09-15 `@sfood/ui` 전면 도입 시 Tailwind를 새로 도입하면서 `globals.css`에 `@tailwind base`(Preflight)를 추가했다. Tailwind Preflight는 브라우저 기본 스타일을 의도적으로 초기화한다 — 제목의 기본 크기, 목록의 불릿·들여쓰기, 인용문의 들여쓰기·테두리를 전부 제거한다. 이 저장소는 원래 이런 걸 브라우저 기본값에 기대고 있었는데(`.article-body`/`.viewer-content`에 문단(`p`)과 `.pullquote`/`.callout`만 스타일을 정의해뒀을 뿐, `h1~h6`/`ul`/`ol`/`li`/`blockquote`/`a`/`hr`/inline `code`는 정의한 적이 없음), Preflight 도입 이후 그 기본값이 사라지면서 실제 문서를 열어보기 전까지 드러나지 않던 회귀가 생겼다.

## 범위 (In Scope)

- `.article-body`(상세 페이지 본문, `viewer-content`와 함께 적용됨) 안에서 Confluence 컴포넌트 컨버터(`converter.ts`)가 그대로 통과시키는 표준 HTML 요소에 에디토리얼 디자인에 맞는 스타일을 추가한다: `h1`~`h4`, `ul`/`ol`/`li`, `blockquote`, 본문 내 `a`, `hr`, 인라인 `code`.
- 기존에 이미 스타일이 있는 것(`.viewer-panel`류, `.viewer-code`, `.viewer-table`, `.pullquote`, `.callout`, 리드 문단)은 건드리지 않는다.

## Out of Scope

- `converter.ts`의 매크로 매핑 로직 자체 변경 — 이번은 순수 CSS 복구다.
- Confluence storage format에서 아직 확인되지 않은 요소(체크리스트, 멘션, expand 매크로 등) — 실제로 나타나면 그때 추가한다.

## 수용 기준

- [ ] 실제 게시 문서(`/posts/instructions-0399ebbc-177a-4124-8c73-fdfe8a03cb71`)에서 `h2` 소제목이 본문보다 뚜렷하게 크고 굵게 보인다.
- [ ] 글머리 목록이 불릿+들여쓰기와 함께 보인다.
- [ ] 인용문(`blockquote`)이 본문과 시각적으로 구분된다.
- [ ] `npm run lint`/`npm run build` 통과.
- [ ] 925studios AI 슬롭 체크리스트 재점검(균일한 크기 문제 해소 확인).

## 가정

- Tailwind Preflight를 걷어내는 대신(다른 `@sfood/ui` 컴포넌트가 Preflight의 일관된 기본값에 의존할 수 있어 위험) 우리 쪽 CSS로 명시적으로 복구하는 방향을 택한다.
