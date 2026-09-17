# tasks — 리다이렉트 UUID 비교 대소문자 무관 처리

## 구현

- [x] `src/lib/viewer/posts.ts`: `extractTrailingUuid` 반환값 소문자 정규화

## 검증

- [x] `npm run lint`
- [x] `npm run build`
- [x] 대문자 UUID 슬러그로 308 리다이렉트 확인
- [x] 기존 소문자 UUID 케이스 회귀 없음 확인

## 문서

- [x] `test-result.md` 작성
- [x] `result.md` 작성
