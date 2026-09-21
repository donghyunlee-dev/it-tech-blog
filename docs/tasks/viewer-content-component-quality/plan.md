# plan — 상세 페이지 콘텐츠 컴포넌트 표현 품질 개선

spec.md의 발견 사항을 영향도·구현 난이도 기준으로 4단계로 나눈다. 각 단계는 독립적으로 배포 가능하다.

## Phase 1 — 콘텐츠 손실 복구 (P0)

### 1a. 인라인 이미지 표시

가장 영향이 크지만 유일하게 사전 조사(스파이크)가 필요한 항목이다.

- **조사 필요**: Confluence 첨부파일은 `GET /api/v2/pages/{id}/attachments`로 목록을 얻을 수 있고 각 항목에 `downloadLink`가 있지만, 실제 다운로드는 Basic Auth가 필요하다(`src/lib/confluence/client.ts`가 이미 이 인증 방식을 씀). 브라우저가 `<img src>`로 직접 요청하면 인증 헤더를 붙일 수 없으므로, 다음 중 하나가 필요하다:
  - (A) Next.js 라우트 핸들러(`/api/attachments/[pageId]/[filename]` 등)를 새로 만들어 서버가 Confluence에서 이미지를 받아 그대로 스트리밍(프록시)한다.
  - (B) Confluence 인스턴스가 해당 Space를 익명/공개로 열어뒀다면 `downloadLink`를 그대로 공개 URL로 써도 되는지 확인한다.
  - 어느 쪽이든 실제 Confluence 인스턴스 설정 확인이 먼저다 — 이 저장소 코드만으로는 결론 못 냄.
- **converter.ts 변경**: `MACRO_REGEX`에 얽매이지 않는 별도 함수로 `<ac:image ...>...<ri:attachment ri:filename="..."/>...</ac:image>` 및 `<ri:url ri:value="...">`(외부 이미지) 패턴을 매칭해 `<figure><img src="{resolved}" alt=""><figcaption>{ac:caption 있으면}</figcaption></figure>`로 변환. `stripUnmappedMacros`보다 먼저 실행해야 한다(먼저 제거되면 정보가 사라짐).
- **posts.ts**: `buildPostDetail`이 pageId를 이미 알고 있으므로, 변환 시 pageId를 함께 넘겨 `filename → 프록시 URL` 매핑에 사용.
- **globals.css**: 이미지가 `.article-body` 안에서 카드처럼 보이도록 `figure`/`figcaption` 스타일 추가(현재 정의 없음).
- **완료 기준**: "컴포넌트 테스트" 문서에서 실제 업로드 이미지가 보인다.

### 1b. 코드 블록 구문 강조

- **라이브러리**: `shiki` 도입 권장 — 이 프로젝트는 SSR/ISR(요청마다 서버에서 `convertStorageToHtml` 실행, `revalidate=60`)이라 클라이언트 번들이 늘지 않는 서버 사이드 하이라이터가 구조에 맞는다. `highlight.js`/`prismjs`보다 TextMate 문법 기반이라 정확도도 높다.
- **converter.ts**: `code` 매크로의 `ac:parameter ac:name="language"` 값을 추출하는 `extractParam` 헬퍼 추가. `convertMacros`가 `shiki`를 호출해 하이라이팅된 HTML을 직접 삽입 — 이 때문에 `convertStorageToHtml`과 호출 체인(`buildPostDetail` 등)이 `async`가 되어야 함(이미 대부분 `async`라 영향 작음).
- **클래스 없는 순정 `<pre><code>`(Editor 자체 코드 블록, language 파라미터 없음)**: 언어를 모르므로 plaintext로 하이라이팅하거나 현재처럼 무강조 유지. 언어 자동 감지는 범위 밖.
- **globals.css**: 코드 블록 우측 상단에 언어 라벨(`::before` 또는 wrapper `<div class="code-block"><span class="code-lang">java</span><pre>...`) 추가 여부 결정. 복사 버튼은 클라이언트 인터랙션이 필요해 별도 작은 클라이언트 컴포넌트(`CodeBlockActions.tsx` 등)로 분리하는 것을 권장(현재 `.article-body`는 `dangerouslySetInnerHTML` 정적 문자열이라 버튼 클릭 핸들러를 못 붙임 — hydration 방식 재검토 필요, 없으면 복사 버튼은 이번 범위에서 제외하고 별도 후속 작업으로 미룸).
- **완료 기준**: `language` 파라미터가 있는 코드 블록에 언어별 색상이 적용된다.

## Phase 2 — 구조적 상호작용 복구 (P1)

### 2a. 펼치기(expand) 매크로 → `<details>/<summary>`

- **converter.ts**: `MACRO_REGEX`에 `expand` 추가. `info|note|warning|tip`과 달리 제목이 `ac:parameter ac:name="title"`에 있으므로 별도 분기 필요:
  `<details class="viewer-expand"><summary>{title 또는 기본값 "더 보기"}</summary>{richTextBody}</details>`
- **globals.css**: `.viewer-expand`/`.viewer-expand summary` 스타일 신규 추가 — 이번에 만든 모바일 목차 카드(`.toc-inline`)와 유사한 톤(카드 배경 없이 얇은 선 + 화살표 아이콘 정도로 본문과 자연스럽게 어울리게, 목차 카드와는 시각적으로 구분되게 디자인).
- **완료 기준**: 펼치기 매크로가 기본 닫힘 상태로 렌더링되고 클릭 시 펼쳐진다.

### 2b. 콜아웃 4종 색상/아이콘 구분

- **globals.css**: `.viewer-panel-info`/`-note`/`-tip`에 각각 다른 accent 색(브랜드 레드 외 보조 색상 필요 — `@sfood/ui` 토큰에 존재하는지 확인 후 없으면 디자인 승인 필요) + 아이콘(ℹ️/📝/💡 또는 SVG) 추가. `warning`은 기존 유지.
- **완료 기준**: 4종 콜아웃이 색상만으로도 구분된다.

## Phase 3 — 다듬기 (P2)

- **인용문 강화**: `.article-body blockquote`에 배경(`--surface-muted`)·인용부호·이탤릭 중 선택 적용. 죽은 클래스 `.pullquote`를 재사용할지, blockquote 자체를 강화할지 결정 필요 — Confluence 네이티브 인용문은 항상 `<blockquote>`로 오므로 컨버터가 `pullquote` 클래스를 붙일 방법이 없다(Confluence에 "풀쿼트"라는 별도 매크로가 없음). **`.pullquote`는 죽은 코드로 보고 정리(제거 또는 blockquote와 통합) 권장.**
- **표 스타일**: 헤더 배경 강조, 줄무늬, `overflow-x:auto` 래퍼로 좁은 화면 대응.

## Phase 4 — 정리 (P3)

- `.viewer-code`와 `.article-body pre` 중복 규칙 통합.

## 열린 질문 (구현 전 확인 필요)

1. Confluence Space가 익명 공개인지, 첨부 다운로드에 인증이 꼭 필요한지 — Phase 1a 착수 전 확인.
2. 코드 복사 버튼처럼 클라이언트 상호작용이 필요한 요소를 `.article-body`(정적 `dangerouslySetInnerHTML`) 안에 어떻게 넣을지 — hydration 전략 필요(예: 본문을 감싸는 클라이언트 컴포넌트가 렌더 후 이벤트 위임으로 처리).
3. `@sfood/ui` 토큰에 info/note/tip 각각에 쓸 보조 색상이 이미 있는지, 없으면 디자인 승인이 필요한지.

## 제안 순서

Phase 1 → Phase 2 → Phase 3 → Phase 4 순으로 각각 별도 PR로 진행할 것을 권장한다(리뷰 단위를 작게 유지, 특히 Phase 1a는 인프라 조사가 선행되어야 하므로 다른 항목과 분리).
