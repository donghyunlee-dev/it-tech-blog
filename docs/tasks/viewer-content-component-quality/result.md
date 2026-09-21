# result — Phase 1 (이미지 복구 + 코드 구문 강조)

## 요약

spec.md의 P0 두 건을 처리했다.

1. **인라인 이미지 복구**: `converter.ts`가 `ac:image`(첨부/외부 URL) 매크로를 전혀 처리하지 않아 본문에서 이미지가 완전히 사라지던 버그를 고쳤다. 첨부 이미지는 Confluence 인증이 필요해 새 프록시 라우트(`/api/attachments/[pageId]/[filename]`)를 통해 서버가 대신 인증해 스트리밍한다.
2. **코드 구문 강조**: `shiki`를 도입해 `code` 매크로의 `language` 파라미터를 살려 서버 사이드로 하이라이팅한다. 언어를 모르는 코드(Editor 네이티브 `<pre><code>`, 매크로를 거치지 않음)는 기존처럼 무강조로 유지된다(범위 밖).

## 변경 파일

- `src/lib/viewer/converter.ts` — `convertImages`(신규), `highlightCode`/`extractMacroParam`(신규), `convertMacros`가 code 매크로에서 shiki를 호출하도록 변경, `convertStorageToHtml`이 `pageId` 인자를 받는 async 함수로 변경.
- `src/lib/viewer/posts.ts` — `convertStorageToHtml` 호출부에 `page.id` 전달 + `await` 추가.
- `src/lib/confluence/client.ts` — `listPageAttachments`, `fetchConfluenceAttachment` 신규.
- `src/app/api/attachments/[pageId]/[filename]/route.ts` — 신규 프록시 라우트.
- `src/app/globals.css` — `.article-body img` 스타일 신규.
- `package.json`/`package-lock.json` — `shiki` 의존성 추가.

## 구현 중 발견한 것 (계획과 달랐던 점)

plan.md는 첨부 다운로드 인증 방식을 "조사 필요"로 남겨뒀는데, 구현하며 실측한 결과:
- 처음 시도한 고전 경로 `/download/attachments/{pageId}/{filename}`는 이 Confluence Cloud 인스턴스에서 502로 실패했다.
- 실제로는 `GET /api/v2/pages/{id}/attachments`로 첨부 목록을 조회해 파일명으로 찾은 뒤, 그 항목의 `downloadLink`(`/rest/api/content/{pageId}/child/attachment/{attachmentId}/download` 형태)를 그대로 써야 했다.
- 이 때문에 이미지 하나당 업스트림 호출이 2번(목록 조회 + 다운로드)이다. 트래픽이 늘면 캐싱이나 첨부 id를 미리 알아두는 최적화가 필요할 수 있다 — 지금은 정확성 우선으로 남겨둠(아래 Next Steps).

## 검증

- `tsc`/`eslint`/`npm run build` 통과.
- converter.ts를 직접 호출하는 단위 확인으로 이미지·코드 하이라이팅 HTML 출력 확인.
- 실제 Confluence 첨부 4개를 `curl`로 직접 호출해 전부 200 확인.
- 브라우저 화면 확인은 dev 서버를 다른 세션과 공유하는 바람에 완전히 깨끗하게는 못 했다 — 상세는 [test-result.md](test-result.md).

## Next Steps (이번 범위 밖, 제안만)

- 첨부 조회 2회 왕복을 줄이기 위한 캐싱(예: 페이지별 첨부 목록을 ISR 캐시와 함께 재사용).
- shiki 하이라이팅이 실제 code 매크로 문서에서 육안으로 잘 보이는지, 별도 dev 서버 단독 환경에서 한 번 더 확인.

---

# result — Phase 2 (펼치기 매크로 + 콜아웃 색상 구분)

## 요약

spec.md의 P1 두 건을 처리했다.

1. **펼치기(expand) 매크로**: `MACRO_REGEX`에 `expand`를 추가하고 `<details class="viewer-expand"><summary>{title}</summary>{내용}</details>`로 변환 — 기본 닫힘 상태, 클릭으로 펼쳐진다. `title` 파라미터가 없으면 "더 보기"로 대체.
2. **콜아웃 4종 색상 구분**: info(파랑)/tip(초록)/warning(기존 브랜드레드 유지)에 각각 accent 색 + 아이콘을 주고, note는 중립 회색을 유지했다(아래 "디자인 판단" 참고).

## 변경 파일

- `src/lib/viewer/converter.ts` — `MACRO_REGEX`에 `expand` 추가, `convertMacros`에 expand 분기 추가.
- `src/app/globals.css` — `.viewer-panel-info`/`-tip`/`-warning`에 accent 색상(`border-left`+아이콘 `::before`), `.viewer-expand`(+`summary`) 스타일 신규.

## 디자인 판단 (design-system.md 준수 확인)

`@sfood/ui` 토큰 패키지(`node_modules/@sfood/ui/tokens/base.css`)를 확인한 결과 옅은 배경 틴트 토큰(`-50`/`-100` 스케일)이 파랑(`--blue-50`/`--blue-100`)에만 있고 초록·노랑 계열에는 없었다. 하드코딩 hex로 임의의 틴트색을 새로 만드는 대신, 상태 토큰(`--color-info`, `--color-success`)을 `color-mix()`로 옅게 섞어 배경을 만들어 토큰 체계 안에 머물렀다. `note`(참고)는 대응하는 상태 토큰이 없고 Confluence 자체에도 뚜렷한 색 관례가 없어, 새 색을 임의로 정하기보다 기존 중립 회색을 유지하고 아이콘(📝)만 추가해 최소한으로 구분했다 — 필요하면 디자인 승인 후 별도 색을 배정할 수 있다.

## 검증

- `tsc`/`eslint`/`npm run build` 통과.
- converter.ts 직접 호출 단위 확인: expand(제목 있음/없음), info/note/tip/warning 4종 모두 예상한 HTML 출력.
- 브라우저(공유 dev 서버, 컴포넌트 테스트 문서)에서 실측:
  - info/warning/note 패널 3종의 `background-color`/`border-left-color`가 서로 다름을 `getComputedStyle`로 확인.
  - `::before` 아이콘 콘텐츠(ℹ️/⚠️/📝) 정상 렌더링 확인.
  - "컴포넌트 테스트" 문서에는 실제 expand 매크로가 없어, `<details class="viewer-expand">`를 임시로 주입해 기본 닫힘 → 클릭 시 펼쳐짐 → 스타일(라운드 14px, summary flex) 정상 동작 확인.
- tip(팁) 콜아웃과 실제 expand 매크로는 이 문서에 없어 육안 확인은 못 함 — converter 단위 테스트로만 확인.

---

# result — Phase 3 (인용문 강화 + 표 스타일 + 죽은 코드 정리)

## 요약

spec.md의 P2 두 건과 열려 있던 정리 항목을 처리했다.

1. **인용문 강화**: `.article-body blockquote`가 회색 얇은 선만 있던 것을, 죽은 `.pullquote` 클래스가 갖고 있던 승인된 시그니처 스타일(브랜드레드 좌측 3px 선, 20px/600 굵기)을 그대로 옮겨 적용했다. 새 디자인을 만들지 않고 이미 승인된 값을 재사용했다.
2. **표 스타일**: 헤더 배경 강조(`--surface-muted`), 짝수 행 줄무늬, `display:block + overflow-x:auto`로 좁은 화면에서 표만 가로 스크롤되게 했다(컨버터가 래퍼 `<div>`를 만들지 않으므로 마크업 변경 없이 CSS만으로 처리).
3. **죽은 코드 정리**: `converter.ts`가 한 번도 만든 적 없는 `.pullquote` 클래스를 삭제했다(위 1번에서 그 스타일을 blockquote로 흡수했으므로).

## 변경 파일

- `src/app/globals.css` — `.article-body blockquote`/`blockquote p` 스타일 교체, `.pullquote` 삭제, `.viewer-table`에 헤더/줄무늬/가로스크롤 스타일 추가.

## 검증

- `tsc`/`eslint`/`npm run build` 통과.
- 브라우저(컴포넌트 테스트 문서)에서 `getComputedStyle`로 실측:
  - blockquote: `border-left-color` 브랜드레드, `font-size` 20px, `font-weight` 600 확인.
  - 표: `th` 배경이 `--surface-muted`로 확인, 짝수 행 `td` 배경이 `rgba(0,0,0,0.02)`로 확인, table 자체가 `display:block`/`overflow-x:auto`로 확인.
- 이번에도 화면 스크린샷은 공유 dev 서버 간섭으로 실패했으나(다른 세션과 동시 사용), computed style 검증으로 실제 적용을 확인했다.
- `grep`으로 `.pullquote`가 `.tsx`/`.ts` 어디에서도 참조되지 않음을 재확인한 뒤 삭제.

---

# result — Phase 4 (중복 CSS 정리)

## 요약

spec.md의 P3(마지막 항목)를 처리했다. `.viewer-code`가 `.article-body pre`와 배경/라운드/패딩/오버플로우/폰트크기를 완전히 동일하게 중복 정의하고 있었다 — `.article-body pre`는 태그 선택자라 클래스 유무와 무관하게 모든 코드 블록에 이미 걸리므로, `.viewer-code`의 자체 스타일은 항상 무의미했다. 중복 규칙만 삭제했다(마크업의 `viewer-code` 클래스 자체는 `stripShikiOwnStyle`이 `.shiki`와 함께 계속 참조하므로 그대로 둠).

## 변경 파일

- `src/app/globals.css` — 독립된 `.viewer-code` 규칙 삭제, 상단 주석 갱신.

## 검증

- `tsc`/`eslint`/`npm run build` 통과.
- 브라우저에서 코드 블록 3개의 `getComputedStyle`(배경/패딩/라운드) 확인 — 정리 전후 값 동일(`rgb(244,244,244)`/`16px`/`14px`), 회귀 없음.

## Phase 1~4 전체 마무리

spec.md/plan.md에서 계획한 4단계(이미지 복구, 코드 강조 / 펼치기 매크로, 콜아웃 색상 / 인용문, 표 스타일 / 중복 정리)를 모두 반영했다.

## 최종 통합 확인 (Phase 1~4 전부 적용된 상태, 2026-09-21)

"컴포넌트 테스트" 문서(`/posts/test-fa031d2f-e820-4d60-a5b6-a68b5f94b692`)를 다시 열어 처음부터 끝까지 점검했다.

- **콘솔/네트워크 오류**: 첫 로드 초반에 같은 첨부 이미지 URL에서 404×2 → 502×1이 있었지만, 그 이후 같은 URL을 포함한 이후 요청 25건 전부 200으로 깨끗했다. `curl`로 순차 5회·동시 5회 재현을 시도했으나 전부 200 — dev 서버가 이번 세션의 잦은 파일 저장(Phase 4 커밋 직전)으로 HMR 재컴파일 중이던 순간의 일회성 워밍업 현상으로 판단, 코드 결함 아님. 프로덕션 빌드(`next build`, HMR 없음)에서는 해당 없음.
- **구조 확인**(`.article-body` 하위 요소 개수): 제목 3개(h2×1, h3×2), 목록 4개, 인용문 1개, 코드 블록 3개(전부 macro 없는 네이티브 `<pre>`라 예상대로 무강조), 인라인 코드 3개, 콜아웃 3개(info/warning/note), 표 1개, 이미지 4개(+ 히어로 1개 = 5), 링크 1개, `<hr>` 2개 — 전부 정상 변환.
- **스타일 실측**(`getComputedStyle`): blockquote(브랜드레드 3px 테두리/20px/600), 코드 블록 3개 배경 동일(`rgb(244,244,244)`), 표 `display:block`(가로 스크롤) + 헤더 배경, 콜아웃 3종 배경·테두리 색 전부 다름, 이미지 4개 전부 `complete && naturalWidth>0`.
- **React 경고**: 없음(hydration 오류 없음).
- 화면 스크린샷은 이번 세션에서 여전히 간헐적으로 실패했으나(공유 dev 서버 렌더링 타이밍 이슈로 추정 — 최초 1장은 성공해 히어로 이미지가 실제로 뜨는 것을 눈으로 확인했다), 위 DOM/스타일 레벨 검증으로 실질적으로 대체했다.

결론: 이번 세션에서 변경한 4단계 전체가 실제 문서에서 정상 동작하며, 변환 과정에서 발생하는 실제 오류는 없다.

## 최종 코드 자체 리뷰에서 발견한 제약사항 (신규 버그 아님, 기존 구조의 한계)

PR 병합 완료 후 `tsc`/`eslint`/`npm run build`를 이 브랜치(Phase 1~4 전부 포함) 기준으로 재실행해 전부 통과를 재확인했고, 추가로 컨버터 로직 자체를 다시 훑어보다가 구조적 한계 하나를 발견했다.

**매크로 중첩을 지원하지 않는다.** `MACRO_REGEX`와 `convertImages`의 정규식은 전부 비탐욕적(`[\s\S]*?`)으로 "가장 가까운 닫는 태그"까지만 잡는다. 매크로 하나가 다른 매크로를 안에 품고 있으면(예: 펼치기 안에 정보 패널), 바깥쪽 매크로가 안쪽 매크로의 닫는 태그에서 잘못 끝나버려 구조가 깨진다. 실제로 재현해보니:

```
입력: <expand title="중첩 테스트"><p>앞부분</p><info><p>안쪽 정보</p></info><p>뒷부분</p></expand>
출력: <details><summary>중첩 테스트</summary><p>앞부분</p><p>안쪽 정보</p></details><p>뒷부분</p>
```

내용 텍스트는 살아남지만(데이터 손실은 없음), `안쪽 정보`가 있던 콜아웃 스타일(배경·"안내" 라벨)이 사라지고 `뒷부분`이 `</details>` 바깥으로 빠져나와 펼치기 영역 밖에 그냥 나열된다.

이건 이번에 새로 만든 버그가 아니라 애초에 code/info/warning/tip 매크로 때부터 있던 정규식 기반 컨버터의 원래 한계다. 다만 이번에 새로 지원한 **펼치기(expand)** 매크로는 실제로 안에 다른 매크로(정보 패널, 코드 블록 등)를 넣는 경우가 흔해서, 예전보다 이 한계에 부딪힐 확률이 높아졌다. 근본적으로 고치려면 정규식 대신 실제 XML/HTML 파서로 컨버터를 다시 짜야 해서 이번 작업 범위를 크게 벗어난다 — 별도 task로 분리해 검토할 것을 제안한다.
