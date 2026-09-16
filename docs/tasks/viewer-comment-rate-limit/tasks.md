# tasks — 외부 사용자 댓글 작성 rate limiting

## 구현

- [x] `src/lib/errors.ts`: `RateLimitError` 추가
- [x] `src/lib/api-response.ts`: `RateLimitError` → 429/`RATE_LIMITED`/`Retry-After` 분기 추가
- [x] `src/lib/rate-limit.ts` 신규: `assertWithinRateLimit` 고정 윈도우 카운터
- [x] `src/app/api/comments/route.ts`: 세션 없는 요청에 rate limit 적용, 클라이언트 IP 추출 유틸 포함

## 검증

- [x] `npm run lint`
- [x] `npm run build`
- [x] 세션 없이 임계치 초과 호출 → 429 확인
- [x] 세션 있는 호출은 제한 없음 확인(코드 레벨)
- [x] 윈도우 경과 후 재허용 확인(코드 레벨)

## 문서

- [x] `test-result.md` 작성
- [x] `result.md` 작성
