# test-result — Phase V4 통합 QA

실 배포 데이터(게시 문서 3건)를 대상으로 로컬 프로덕션 빌드(`npm run start`)에 연결해 점검했다. 모든 점검은 읽기 전용으로 수행했고, 새로운 Confluence 쓰기(댓글 생성 등)는 만들지 않았다.

| 항목 | 방법 | 결과 |
|---|---|---|
| Lint | `npm run lint` | 통과 |
| 빌드 | `rm -rf .next && npm run build` | 통과 |
| `/api/health/confluence` | curl | `status: ok`, 실 서비스 계정 정보로 정상 응답(세부 값은 보안상 이 문서에 남기지 않음) |
| `/api/viewer/posts` | curl | 실 게시 문서 3건 정상 반환 |
| `/sitemap.xml` | curl | 홈 + 게시 문서 3건 URL 모두 포함, `lastmod`가 실제 게시일과 일치 |
| `/robots.txt` | curl | `Allow: /`, `Disallow: /api/`, sitemap 링크 정상 |
| `/rss.xml` | curl | 게시 문서 3건이 `title`/`link`/`guid`/`pubDate`와 함께 정상 포함 |
| 상세 페이지 구조화 데이터 | curl로 JSON-LD 추출 | `@type: BlogPosting`, `headline`/`description`/`datePublished`/`mainEntityOfPage` 모두 실제 값으로 채워짐 |
| 상세 페이지 canonical | curl | `<link rel="canonical">`가 실제 공개 URL과 일치 |
| 리다이렉트(주소 변경) | 실 문서 UUID 재사용 curl | `308`, 현재 publicSlug로 정상 리다이렉트(이전 태스크 이후 회귀 없음) |
| not-found 안내 화면 | curl | `404`, 커스텀 안내 화면 유지 |
| 외부 사용자 rate limiting | 세션 없이 6회 연속 POST | 1~5번째 400(유효성 검증 통과), 6번째 429/RATE_LIMITED(회귀 없음) |
| `?error=` 배너 + 태그 + 댓글 섹션 동시 렌더링 | 브라우저(`preview_start` dev)로 `?error=comment_failed`가 붙은 실 게시 문서 접속 | 에러 배너("댓글 인증에 실패해...")·태그 라인("AI · 업무 · 활용")·댓글 카운트("댓글 0개")·게이트 문구가 레이아웃 충돌 없이 함께 렌더링됨, 콘솔 에러 없음 |
| Slack 알림 경로 | 코드 리뷰(`src/lib/notifications/slack.ts`, `src/lib/api-response.ts`) | `SLACK_WEBHOOK_URL` 미설정 시 `requireEnv`가 던지는 예외를 `notifyUpstreamFailure`가 try/catch로 흡수해 로그만 남기고 원래 502 응답에는 영향 없음을 확인. 실제 webhook 호출은 운영 채널 노이즈 방지를 위해 생략 |

## 발견된 문제

없음 — 최근 3개 PR(rate limiting/redirect/mail-token)이 서로 간섭하지 않고, Phase V2까지의 기존 기능도 회귀 없이 동작함을 확인했다.

## 커버되지 않은 부분(범위 밖/사용자 검증 필요)

- 실 MS 계정 로그인이 필요한 전 구간(로그인 → 댓글 저장 → 메일 수신)은 이전 태스크(#9)에서와 동일하게 AI가 대신할 수 없다.
- Slack 웹훅 실제 발송(성공/실패 양쪽)은 운영 채널에 노이즈를 만들지 않기 위해 이번 QA에서 실제로 트리거하지 않았다.
