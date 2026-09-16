# plan — Next.js Critical 취약점 해소

## 접근 방식

`16.3.0`→`16.3.5`는 patch 버전 차이(semver상 breaking change 없음이 기대됨). `next`와 짝을 맞추는 `eslint-config-next`도 같이 올린다. `next`의 하위 의존성인 `sharp`(현재 0.35.3, High 취약점)도 이번 업그레이드로 함께 해소되는지 확인한다.

## 영향 범위

- `package.json`/`package-lock.json`: `next`, `eslint-config-next` 버전만 변경.

## 검증 전략

1. `npm install next@16.3.5 eslint-config-next@16.3.5`
2. `npm audit`로 next Critical 항목·sharp High 항목이 사라졌는지 확인
3. `npm run lint`, `npm run build`
4. 브라우저로 홈/상세/검색/댓글 화면 회귀 확인(기존 화면 그대로 동작하는지)

## 리스크

- patch 버전 업그레이드라 낮지만, Turbopack 관련 변경이 있을 수 있어 빌드 로그를 주의 깊게 확인한다.
