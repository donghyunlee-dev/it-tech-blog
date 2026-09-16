# result — Next.js Critical 취약점 해소

## 요약

2026-09-14부터 별도 과제로 남아 있던 Next.js Critical RCE 취약점(16.0.0~16.3.2)을 `16.3.5`로 업그레이드해 해소했다. 업그레이드 과정에서 함께 드러난 `js-yaml` High 취약점도 무위험 패치로 같이 해소해 `npm audit` 결과를 **0 vulnerabilities**로 만들었다.

## 변경 파일

- `package.json`/`package-lock.json` — `next` 16.3.0→16.3.5, `eslint-config-next` 16.3.0→16.3.5, `js-yaml` 4.3.1→4.3.2(전이 의존성)

## 검증

- `npm audit` 0 vulnerabilities
- `npm run lint`/`npm run build` 통과 (Next.js 16.3.5로 정상 빌드)
- 브라우저로 홈 화면 회귀 확인 — 시각적 차이 없음, 콘솔 에러 없음

## 열린 과제

없음. patch 버전 업그레이드라 추가로 필요한 코드 변경은 없었다.
