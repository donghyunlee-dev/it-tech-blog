# test-result — 리다이렉트 UUID 비교 대소문자 무관 처리

| 항목 | 방법 | 결과 |
|---|---|---|
| Lint | `npm run lint` | 통과 |
| 빌드 | `rm -rf .next && npm run build` | 통과(1회차는 시스템 리소스 부족으로 실패, 재시도 후 정상 — 이번 코드 변경과 무관한 일시적 OS 오류) |
| 소문자 UUID(회귀) | 실 게시 문서의 UUID를 그대로 쓴 가짜 slug로 curl | `308`, 현재 publicSlug로 정상 리다이렉트(기존과 동일) |
| 대문자 UUID | 동일 UUID를 전부 대문자로 바꾼 가짜 slug로 curl | `308`, 동일하게 정상 리다이렉트 — 수정 전에는 not-found였을 케이스 |
| 혼합 대소문자 UUID | 대소문자를 섞은 가짜 slug로 curl | `308`, 동일하게 정상 리다이렉트 |

## 발견된 문제

없음.
