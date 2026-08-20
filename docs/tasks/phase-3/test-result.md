# Test Result — Phase 3: Viewer 핵심 기능

## 실행한 검증

| 명령/시나리오 | 결과 | 비고 |
|---|---|---|
| `npm run lint` | 통과 | 경고·오류 없음 |
| `npm run build` | 통과 | `/`, `/sitemap.xml`, `/rss.xml`이 ISR(Revalidate 1m)로 등록됨. `/posts/[slug]`는 `generateStaticParams`가 없어 요청마다 서버 렌더링(ƒ) |
| `GET /` (Confluence 자격증명 없음) | 통과 | 크래시 없이 "문서 목록을 불러오지 못했습니다" 안내 노출(200) |
| `GET /posts/nonexistent-slug` (Confluence 자격증명 없음) | 통과 | "문서를 불러오지 못했습니다" 안내 노출(200) — Confluence 연동 실패이므로 404가 아닌 일반 오류로 처리(의도된 동작) |
| `GET /sitemap.xml` | 통과 | 게시 문서가 없어도 루트 URL 1건을 포함한 유효한 XML 반환(200) |
| `GET /robots.txt` | 통과 | `Disallow: /editor, /api/, /login` + `Sitemap:` 라인 포함(200) |
| `GET /rss.xml` | 통과 | 빈 `<channel>`을 포함한 유효한 RSS XML 반환(200) |
| `GET /api/viewer/posts` | 통과 | Confluence 자격증명 없음 → `502 Bad Gateway` + `{"error":{"code":"UPSTREAM_ERROR", ...}}` (api-spec.md 명세대로) |

렌더링·라우트 확인은 `npm run dev`로 로컬 서버를 띄운 뒤 브라우저로 직접 접속해 수행했다. 서버 로그에서 예상치 못한 오류는 발견되지 않았다.

## 미검증 항목(실 Confluence 데이터 필요)

- 실제 게시된 문서가 있을 때 목록/상세/관련 글/sitemap/RSS에 실제 콘텐츠가 올바르게 채워지는지
- `GET /posts/{slug}`가 실제로 게시 해제된(또는 존재한 적 없는) slug에 대해 `notFound()`(404)를 반환하는지 — 이번 테스트는 Confluence 연동 자체가 실패하는 상황만 확인했다(다른 오류 경로)
- Confluence storage format의 code/info/note/warning/tip 매크로와 표가 실제로 올바르게 변환되는지(현재 컨버터는 정규식 기반이며, 실제 Confluence 문서로 검증되지 않았다)
- canonical URL, JSON-LD, OpenGraph 메타 태그가 실제 배포 도메인(`SITE_BASE_URL`)으로 올바르게 채워지는지(로컬에서는 기본값 `http://localhost:3000`로 확인)

## 참고(이번 변경과 무관한 기존 조건)

- `CONFLUENCE_BASE_URL`/`CONFLUENCE_EMAIL`/`CONFLUENCE_API_TOKEN`/`CONFLUENCE_SPACE_KEY`가 로컬 `.env`에 없어 모든 Confluence 연동 호출이 502로 처리된다. Phase 1/2부터 존재하던 조건이며, 실제 자격증명이 채워지면 해소된다.
