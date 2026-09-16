# result — 외부 사용자 댓글 작성 rate limiting

## 요약

`docs/product/api-spec.md`에 이미 문서화되어 있던 "외부 사용자 rate limiting 초과 시 429" 계약을 실제로 구현했다. architecture.md의 자체 DB 미도입 원칙에 맞춰 별도 저장소 없이 서버 프로세스 메모리 기반 고정 윈도우 카운터로 처리했다.

## 변경 파일

- `src/lib/errors.ts` — `RateLimitError`(429, `retryAfterSeconds`) 추가
- `src/lib/api-response.ts` — `RateLimitError` → `429`/`RATE_LIMITED`/`Retry-After` 헤더 분기 추가
- `src/lib/rate-limit.ts`(신규) — `assertWithinRateLimit(key, { limit, windowMs })`: 메모리 `Map` 기반 고정 윈도우 카운터
- `src/app/api/comments/route.ts` — 세션 없는(외부 사용자) 요청에 한해 IP당 1분 5회로 제한. 클라이언트 IP는 `x-forwarded-for`(첫 값)/`x-real-ip`에서 추출

## 검증

- `npm run lint`/`npm run build` 통과
- 프로덕션 빌드를 로컬에서 기동해 세션 없는 상태로 6회 연속 호출 → 1~5번째는 정상적으로 유효성 검증 단계까지 도달(400), 6번째는 `429 RATE_LIMITED` + `Retry-After: 47` 확인
- 상세는 [test-result.md](test-result.md) 참고

## 열린 과제

- Vercel 서버리스 인스턴스가 여러 개로 분산되면 메모리 기반 카운터가 인스턴스별로 독립적으로 동작해 완벽한 차단은 아니다 — "기본적인" 수준의 방어이며, 실제 악용이 관측되면 영속 저장소(Redis 등) 도입을 재검토한다(architecture.md의 캐시 계층 트레이드오프와 동일한 원칙).
- 제한 값(IP당 1분 5회)은 문서/요구사항에 구체적 수치가 없어 임의로 정한 값이다 — 실사용 데이터가 쌓이면 조정이 필요할 수 있다.
