# plan — 리다이렉트 UUID 비교 대소문자 무관 처리

## 접근 방식

`extractTrailingUuid`의 반환값을 `.toLowerCase()`로 정규화한다. 다른 함수(`resolvePostRoute`)는 변경할 필요가 없다 — 애초에 대소문자 무관 정규식으로 "이 형태면 UUID로 취급한다"고 판단해 놓고 반환값을 그대로 쓰는 것이 불일치의 원인이므로, 판단과 반환을 일관되게 소문자로 맞추는 것이 가장 단순하고 근본적인 수정이다.

## 영향 범위

- `src/lib/viewer/posts.ts`: `extractTrailingUuid`의 `return isUuid ? candidate : null;`을 `return isUuid ? candidate.toLowerCase() : null;`로 변경.

## 검증 전략

1. `npm run lint`, `npm run build`.
2. 실 게시 문서의 UUID를 대문자로 바꾼 슬러그로 접근해 308 리다이렉트되는지 확인(기존 viewer-post-redirect 태스크와 동일한 방식 — 실 데이터 변경 없이 UUID 재사용).
3. 기존 소문자 UUID 케이스 회귀 없음 확인.

## 리스크

- 없음 — 한 줄짜리 정규화 수정으로, 다른 동작에 영향을 주지 않는다.
