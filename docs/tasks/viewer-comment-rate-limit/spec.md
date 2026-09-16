# spec — 외부 사용자 댓글 작성 rate limiting

## 문제 정의

architecture.md 보안 섹션과 `docs/product/api-spec.md`(`POST /api/comments` 실패 응답 표, 429 항목)는 "외부 사용자 댓글 작성 엔드포인트에 기본적인 요청 빈도 제한을 적용해 스팸성 댓글 및 무차별 API 호출을 방지한다"고 명시하고 있으나, 실제 `src/app/api/comments/route.ts`에는 rate limiting 로직이 없다. 문서화된 계약과 구현이 어긋나 있는 상태다.

## 범위 (In Scope)

- `POST /api/comments`에서 **세션이 없는(외부 사용자) 요청**에 한해 IP 기준 고정 윈도우 rate limiting을 적용한다.
- 제한 초과 시 `429`, `error.code = "RATE_LIMITED"` 응답과 `Retry-After` 헤더를 반환한다.
- 자체 DB를 두지 않는 기존 아키텍처 결정(architecture.md)에 맞춰 별도 저장소 없이 서버 프로세스 메모리로 처리한다.

## Out of Scope

- MS 로그인 사용자(세션 보유) 댓글 작성 제한 — api-spec.md가 "외부 사용자"로 범위를 명시했고, 세션으로 이미 신원이 식별되어 스팸 위험이 낮으므로 이번 범위에 포함하지 않는다.
- 서버리스 인스턴스 간 공유되는 영속 저장소(Redis 등) 도입 — architecture.md의 트레이드오프 문단대로, 실제 악용이 확인되면 그때 재검토한다.
- `GET /api/comments`(댓글 조회) — 쓰기 엔드포인트만 대상.

## 수용 기준

- [ ] 세션 없는 요청이 짧은 시간 내 임계치를 넘으면 `429`와 `RATE_LIMITED` 코드를 반환한다.
- [ ] 세션 있는(MS 로그인) 요청은 동일한 빈도로 반복해도 제한되지 않는다.
- [ ] 응답에 `Retry-After` 헤더가 포함된다.
- [ ] 윈도우가 지나면 다시 요청이 허용된다.
- [ ] `npm run lint`/`npm run build` 통과.

## 엣지 케이스

- `x-forwarded-for` 헤더가 여러 IP를 콤마로 나열하는 경우 첫 번째 값(클라이언트에 가장 가까운 프록시가 아니라 원 클라이언트)을 사용한다.
- IP를 특정할 수 없는 경우(`x-forwarded-for`/`x-real-ip` 모두 없음) 전체를 하나의 키로 묶어 과도하게 제한되더라도 안전한 쪽(차단)으로 fallback한다.
