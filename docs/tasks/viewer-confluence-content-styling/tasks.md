# tasks — Confluence 본문 요소 스타일 복구

## 구현

- [x] `globals.css`에 `h1`~`h3`, `ul`/`ol`/`li`, `blockquote`, 본문 `a`, `hr`, 인라인 `code` 스타일 추가

## 검증

- [x] `npm run lint`
- [x] `npm run build`
- [x] 실 게시 문서로 `getComputedStyle` 확인(`h2` 24px/700, `ul` list-style disc + 22px 들여쓰기, `blockquote` 3px 보더 + 20px 들여쓰기 + 세컨더리 톤)
- [x] 스크린샷 육안 확인(제목이 본문보다 뚜렷하게 커짐)
- [x] AI 슬롭 체크리스트 재점검

## 문서

- [x] `test-result.md` 작성
- [x] `result.md` 작성
