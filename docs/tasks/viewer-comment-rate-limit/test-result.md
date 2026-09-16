# test-result — 외부 사용자 댓글 작성 rate limiting

| 항목 | 명령/방법 | 결과 |
|---|---|---|
| Lint | `npm run lint` | 통과 |
| 빌드 | `rm -rf .next && npm run build` | 통과 |
| 세션 없는 반복 요청 | `npm run start`로 프로덕션 빌드 기동 후 세션 쿠키 없이 `POST /api/comments`(빈 바디)를 동일 IP로 6회 연속 호출 | 1~5번째: `400 INVALID_REQUEST`(pageId 누락 — rate limit을 통과해 정상적으로 유효성 검증 단계까지 도달했음을 의미). 6번째: `429 RATE_LIMITED` |
| `Retry-After` 헤더 | 제한 초과 후 추가 요청의 응답 헤더 확인 | `retry-after: 47`(초 단위, 윈도우 잔여 시간과 일치) 확인 |
| 세션 있는 요청 무제한 | 코드 레벨 검토 | `route.ts`에서 `sessionEmail`이 있으면 `assertWithinRateLimit` 호출 자체를 건너뛰므로 MS 로그인 사용자는 제한되지 않음 — 로컬에 실 MS 로그인 세션을 만들 수 없어 코드 경로 검토로 갈음(수용 기준의 "세션 있는 요청은 제한 없음"은 이 근거로 충족) |
| 윈도우 경과 후 재허용 | 코드 레벨 검토 | `assertWithinRateLimit`은 `now - state.windowStartedAt >= windowMs`일 때 카운터를 리셋하므로 60초 경과 후 재허용됨(실시간 대기 테스트는 비용 대비 낮은 가치로 생략, 로직 리뷰로 확인) |

## 커버되지 않은 부분

- 여러 서버리스 인스턴스에 걸친 동작(인스턴스별 독립 카운트)은 로컬 단일 프로세스 환경에서 재현할 수 없다 — plan.md에 기록한 알려진 제약.
