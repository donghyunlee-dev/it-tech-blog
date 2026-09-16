# plan — 외부 사용자 댓글 작성 rate limiting

## 접근 방식

기존 에러 계층(`src/lib/errors.ts` → `src/lib/api-response.ts`) 패턴을 그대로 따른다. 새 `RateLimitError`를 추가하고, 별도의 순수 유틸(`src/lib/rate-limit.ts`)로 고정 윈도우 카운터를 구현해 라우트 핸들러에서 세션 없는 요청에만 호출한다.

## 영향 범위

- `src/lib/errors.ts`: `RateLimitError`(429, `retryAfterSeconds` 보유) 추가.
- `src/lib/api-response.ts`: `toErrorResponse`에 `RateLimitError` 분기 추가 — `RATE_LIMITED` 코드, `Retry-After` 헤더.
- `src/lib/rate-limit.ts`(신규): `assertWithinRateLimit(key, { limit, windowMs })` — 메모리 `Map` 기반 고정 윈도우 카운터. 초과 시 `RateLimitError` throw.
- `src/app/api/comments/route.ts`: `POST` 핸들러에서 `session` 없을 때만 클라이언트 IP(`x-forwarded-for`/`x-real-ip`) 기준으로 `assertWithinRateLimit` 호출.
- `docs/product/api-spec.md`: 이미 429 계약이 문서화되어 있어 별도 수정 불필요(구현만 맞춘다).

## 제한 값

- 외부 사용자 IP당 **1분에 5회**로 설정한다. 대댓글로 짧은 대화가 이어질 수 있는 정상 사용은 허용하면서, 스팸 봇의 반복 호출은 차단하는 수준으로 판단했다(문서/요구사항에 구체적 수치가 없어 임의로 정함 — 실사용 데이터가 쌓이면 조정 가능).

## 검증 전략

1. `npm run lint`, `npm run build`.
2. 세션 없는 상태로 `POST /api/comments`를 임계치 이상 연속 호출 → 6번째 요청이 `429`/`RATE_LIMITED`/`Retry-After` 응답인지 확인.
3. 동일 흐름에서 세션 쿠키를 붙여 호출 시 제한되지 않는지 확인(코드 레벨 검토 + 가능하면 로컬 인증 세션으로 확인).
4. 윈도우 경과 후 재요청이 허용되는지 확인.

## 리스크

- Vercel 서버리스 인스턴스는 여러 개로 분산될 수 있어 메모리 기반 카운터가 인스턴스마다 독립적으로 동작한다 — 완벽한 차단은 아니며 "기본적인" 수준의 방어임을 result.md에 명시한다. 필요해지면 그때 영속 저장소를 검토한다(architecture.md 트레이드오프와 동일한 원칙).
- 프로세스가 오래 떠 있으면 `Map`에 만료된 키가 누적될 수 있으나, 엔트리당 용량이 작고(IP당 두 개 숫자) 서버리스 인스턴스가 주기적으로 재활용되므로 별도 정리 로직 없이도 허용 가능한 수준으로 판단한다.
