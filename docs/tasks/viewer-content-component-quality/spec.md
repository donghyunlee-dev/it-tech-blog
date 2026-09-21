# spec — 상세 페이지 콘텐츠 컴포넌트 표현 품질 개선

## 문제 정의

"컴포넌트 테스트" 문서(`/posts/test-fa031d2f-e820-4d60-a5b6-a68b5f94b692`)로 실제 렌더링을 확인한 결과, IT 기술 블로그로서 갖춰야 할 콘텐츠 컴포넌트(코드 블록, 인용, 콜아웃, 접기/열기, 표, 이미지) 표현이 전반적으로 미흡하다. `src/lib/viewer/converter.ts`와 `src/app/globals.css`를 대조 확인해 원인을 특정했다.

## 발견 사항 (심각도순)

### P0 — 인라인 이미지가 본문에서 완전히 사라짐 (콘텐츠 손실)

`converter.ts`의 `MACRO_REGEX`는 `code|info|note|warning|tip`만 매핑하고, Confluence가 첨부 이미지를 감싸는 `<ac:image><ri:attachment .../></ac:image>` 매크로는 매핑 대상이 아니어서 `stripUnmappedMacros`가 태그만 제거하고 내용(빈 내부)을 그대로 통과시킨다 — 즉 `<img>` 태그 자체가 한 번도 생성되지 않는다. `heroImageUrl`도 같은 변환 결과 HTML에서 `<img src="...">` 패턴을 찾는 `extractFirstImageSrc`(`src/lib/viewer/posts.ts:58`)에 의존하므로, 업로드된 첨부 이미지는 히어로로도 선택되지 않는다(외부 URL을 직접 붙여넣은 경우만 우연히 동작).
"컴포넌트 테스트" 문서 본문에 작성자가 직접 남긴 "왜 또 이미지가 깨져서 보이는지 모르겠다"라는 문구가 이 증상을 가리키는 것으로 보인다. 브라우저에서 확인해도 `.article-body` 안에 `<img>` 태그가 0개였다.

### P0 — 코드 블록에 구문 강조(syntax highlighting) 없음

`code` 매크로는 `<pre class="viewer-code"><code>{escaped text}</code></pre>`만 생성하고 Confluence가 갖고 있는 `ac:parameter ac:name="language"` 값을 버린다. 하이라이팅 라이브러리(shiki/prism/highlight.js 등)는 `package.json`에 전혀 설치돼 있지 않다. 코드가 전부 단색 텍스트로만 보여 기술 블로그 품질 기준에 못 미친다.

### P1 — Confluence "펼치기(expand)" 매크로가 접기/펼치기 없이 풀려서 나옴

`ac:name="expand"`는 `MACRO_REGEX`에 없어 `stripUnmappedMacros`가 래퍼 태그만 벗기고 내부 내용을 평문으로 흘려보낸다. 즉 원문에서 접혀 있던 긴 코드/로그가 상세 페이지에서는 항상 펼쳐진 상태로만 보이고, 클릭으로 접는 상호작용 자체가 없다.

### P1 — 콜아웃(정보/경고/참고/팁) 시각 구분 부족

`.viewer-panel-warning`만 브랜드레드 톤 배경으로 구분되고(`globals.css:797`), `info`/`note`/`tip`은 전부 동일한 회색 배경·아이콘 없음으로 렌더링된다. 4종류 패널이 실질적으로 2종류로만 보인다.

### P2 — 인용문(`blockquote`)이 존재감이 약함

`.article-body blockquote`(`globals.css:534`)는 좌측 3px 회색 테두리만 있고 배경·인용부호·기울임 등 시각적 강조가 없어 본문과 잘 구분되지 않는다. 한편 이미 정의돼 있는 `.pullquote`(브랜드레드 테두리, 20px 강조 스타일, `globals.css:767`)는 컨버터가 전혀 생성하지 않는 죽은 클래스다.

### P2 — 표 스타일이 평범함

`.viewer-table`(`globals.css:1166`)은 셀 테두리만 있고 헤더 강조·줄무늬(zebra)·좁은 화면 가로 스크롤 처리가 없다.

### P3 — 중복 CSS

`.viewer-code`(`globals.css:1179`)와 `.article-body pre`(`globals.css:570`)가 배경·라운드·패딩을 거의 동일하게 중복 정의하고 있다(과거 회귀 수정 과정에서 누적됨, `docs/tasks/viewer-confluence-content-styling/result.md` 참고). 기능상 문제는 없으나 정리 대상.

## 범위 (In Scope)

- `converter.ts`: 이미지 매크로 매핑, expand 매크로 → `<details>/<summary>` 매핑, code 매크로의 `language` 파라미터 보존.
- 코드 블록 구문 강조 라이브러리 도입 및 적용(서버 렌더링 방식 우선 검토 — 이 프로젝트는 SSR/ISR 구조라 클라이언트 번들을 늘리지 않는 방식이 적합).
- `globals.css`: 콜아웃 4종 구분, 인용문 강화, `<details>/<summary>` 스타일, 표 스타일 개선, 중복 규칙 정리.
- 이미지 URL 해석에 Confluence 첨부파일(attachment) 다운로드 API 연동이 필요한지 확인 — 필요 시 별도 하위 작업으로 분리.

## Out of Scope

- Editor 쪽(별도 저장소 `sfood-it-editor`) 변경 — 이번 저장소에서 접근 불가.
- 체크리스트, 멘션 등 아직 실제 문서에서 관측되지 않은 Confluence 요소.
- 레이아웃/정렬 작업(이전 작업, `docs/tasks/` 내 다른 폴더에서 이미 진행 중).

## 수용 기준

- [ ] "컴포넌트 테스트" 문서에서 업로드된 첨부 이미지가 실제로 표시된다.
- [ ] 코드 블록에 언어별 구문 강조가 적용된다.
- [ ] 펼치기 매크로가 기본 접힘 상태의 `<details>`로 렌더링되고 클릭으로 펼쳐진다.
- [ ] info/note/warning/tip 4종 콜아웃이 서로 다른 색/아이콘으로 구분된다.
- [ ] 인용문이 본문과 뚜렷이 구분되는 스타일을 갖는다.
- [ ] `npm run lint` / `npm run build` 통과, 콘솔 에러 없음.
