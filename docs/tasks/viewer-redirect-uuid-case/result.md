# result — 리다이렉트 UUID 비교 대소문자 무관 처리

## 요약

자체 코드 리뷰 4번 항목을 해결했다. `extractTrailingUuid`가 대소문자 무관 정규식으로 "UUID 형태"를 판단해 놓고 원래 대소문자 그대로 반환해, 이후 `===` 비교가 실패하던 불일치를 반환값 자체를 소문자로 정규화해 없앴다.

## 변경 파일

- `src/lib/viewer/posts.ts` — `extractTrailingUuid`가 매칭된 값을 `.toLowerCase()`로 정규화 후 반환

## 검증

- `npm run lint`/`npm run build` 통과
- 실 게시 문서의 UUID를 소문자/대문자/혼합 대소문자로 각각 재사용한 가짜 slug 세 가지 모두 정상적으로 308 리다이렉트됨을 확인(회귀 없음, 버그 재현 후 수정 확인)
- 상세는 [test-result.md](test-result.md) 참고

## 열린 과제

- 없음.
