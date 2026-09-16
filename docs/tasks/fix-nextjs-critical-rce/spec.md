# spec — Next.js Critical 취약점 해소

## 문제 정의

`npm audit` 결과 `next@16.3.0`(범위 16.0.0~16.3.2)에 **Critical 등급 원격 코드 실행(RCE)** 취약점이 있다. 수정 버전은 `16.3.5`. 이 취약점은 design-system-adoption.md 조사 중(2026-09-14) 처음 발견되어 별도 과제로 남겨져 있던 것이다.

## 범위 (In Scope)

- `next`를 `16.3.5`(또는 그 이상 patch)로 업그레이드.
- 업그레이드로 인한 회귀가 없는지 빌드·주요 화면 확인.
- `npm audit`으로 해당 취약점이 실제로 해소됐는지 재확인.

## Out of Scope

- `js-yaml`(eslint의 개발 의존성 전이 종속성, 프로덕션 번들에 포함되지 않음, 현재 audit 기준 수정 버전 없음)은 이번 범위에서 다루지 않는다.
- Next.js 16.3.0→16.3.5는 patch 버전 차이라 기능 변경 없이 보안 수정만 포함될 것으로 예상하지만, 실제 changelog 확인 후 breaking change 여부를 재확인한다.

## 수용 기준

- [ ] `npm audit`에서 `next` Critical 취약점이 더 이상 보고되지 않는다.
- [ ] `npm run lint`/`npm run build` 통과.
- [ ] 홈/상세/댓글/검색 화면이 업그레이드 전과 동일하게 동작한다(회귀 없음).
