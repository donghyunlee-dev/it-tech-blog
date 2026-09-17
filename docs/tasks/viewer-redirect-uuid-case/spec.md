# spec — 리다이렉트 UUID 비교 대소문자 무관 처리

## 문제 정의

자체 코드 리뷰(2026-09-17, `docs/product/prd.md`) 4번 항목. `src/lib/viewer/posts.ts`의 `extractTrailingUuid`는 대소문자 무관 정규식(`/i`)으로 슬러그 끝의 UUID "형태"만 검사하고, 매칭된 값은 원래 대소문자 그대로 반환한다. 반면 `resolvePostRoute`가 이 값을 `entry.page.title`과 비교할 때는 `===`(대소문자 구분)를 쓴다. 실제 Confluence 페이지 title은 항상 소문자 `randomUUID()` 값(data-spec.md)이므로, 대문자나 혼합 대소문자가 섞인 옛 주소는 형태 검사는 통과하고도 매칭에 실패해 리다이렉트 대신 not-found로 빠진다.

## 범위 (In Scope)

- `extractTrailingUuid`가 반환하는 값을 소문자로 정규화한다.

## Out of Scope

- `page.title` 자체를 정규화하는 것 — Editor가 쓰는 실제 값(항상 소문자)을 그대로 신뢰한다.

## 수용 기준

- [ ] 대문자/혼합 대소문자 UUID가 포함된 슬러그로 접근해도, 소문자 UUID와 동일하게 매칭되어 정상적으로 리다이렉트된다.
- [ ] 기존 소문자 UUID 동작은 회귀 없음.
- [ ] `npm run lint`/`npm run build` 통과.
