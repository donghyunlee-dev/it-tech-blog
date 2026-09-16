# tasks — Next.js Critical 취약점 해소

## 구현

- [x] `next`, `eslint-config-next`를 `16.3.5`로 업그레이드
- [x] `npm audit fix`로 함께 드러난 `js-yaml` High 취약점도 해소(패치 버전, 무위험 판단)

## 검증

- [x] `npm audit` — 0 vulnerabilities
- [x] `npm run lint`
- [x] `npm run build`
- [x] 브라우저로 홈 화면 회귀 확인(실 게시글 정상 노출, 콘솔 에러 없음)

## 문서

- [x] `test-result.md` 작성
- [x] `result.md` 작성
