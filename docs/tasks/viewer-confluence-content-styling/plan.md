# plan — Confluence 본문 요소 스타일 복구

## 접근 방식

`src/app/globals.css`의 `.article-body` 규칙 바로 아래에, 읽기 폭(680px)·줄간격(1.7~1.8)·에디토리얼 톤(브랜드 레드는 강조에만)이라는 기존 원칙을 그대로 따르는 제목/목록/인용문/링크/구분선/인라인 코드 스타일을 추가한다.

## 영향 범위

- `src/app/globals.css`만 수정(컴포넌트/데이터 계층 변경 없음).
  - `h2`: 24px/700/여백으로 섹션 구분감을 준다(design-system.md의 "Card Heading" 22px과 유사한 급).
  - `h3`: 19px/700.
  - `h1`(본문 내부에 드물게 등장할 경우 대비): 28px/700.
  - `ul`/`ol`: 불릿/번호 복구, `padding-left`로 들여쓰기, `li` 간 8px 간격.
  - `li > p`: 목록 안 문단의 중복 여백 제거.
  - `blockquote`: 왼쪽 hairline 보더 + 들여쓰기 + 세컨더리 톤(브랜드 레드는 `.pullquote`용으로 이미 예약되어 있어 인용문 기본값은 중립색으로 구분).
  - 본문 내 `a`: 브랜드 레드 + 밑줄(호버 시 더 진한 레드) — 클릭 가능한 링크임을 분명히 한다.
  - `hr`: hairline 구분선.
  - 인라인 `code`: `.viewer-code`(블록)와 구분되는 인라인용 배경/라운드.

## 검증 전략

1. `npm run lint`, `npm run build`.
2. 실제 게시 문서 상세 페이지를 브라우저로 열어 `getComputedStyle`로 `h2`/`ul`/`blockquote`의 `fontSize`/`listStyleType`/`borderLeftWidth`가 의도한 값으로 나오는지 확인(이번 회귀를 처음 발견한 방법과 동일).
3. 스크린샷으로 육안 확인.
4. design-direction.md의 AI 슬롭 체크리스트 재적용.

## 리스크

- Tailwind Preflight는 `@sfood/ui` 컴포넌트들이 일관된 기준선 위에서 동작하도록 전제하는 것이라, 이번처럼 우리 쪽 콘텐츠 영역에만 복구 스타일을 얹는 방식이 맞다(Preflight 자체를 끄면 `@sfood/ui` 컴포넌트 쪽에서 다른 회귀가 날 수 있음). 앞으로 새로운 HTML 요소(체크리스트 등)가 실제 문서에 등장하면 같은 패턴의 회귀가 또 생길 수 있으니, 실제 문서를 열어볼 때마다 이 목록에 없는 요소가 있는지 확인하는 습관이 필요하다.
