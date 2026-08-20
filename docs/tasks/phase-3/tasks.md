# Tasks — Phase 3: Viewer 핵심 기능

## 구현 작업

- [x] `src/lib/confluence/client.ts`에 `listAllSpacePages` 추가
- [x] `src/lib/viewer/posts.ts` 작성(목록/상세/관련 글)
- [x] `src/lib/viewer/converter.ts` 작성(매크로 변환·표·최소 정제)
- [x] `src/lib/viewer/related-sites.ts` 작성(연관 사이트 플레이스홀더)
- [x] `GET /api/viewer/posts`, `GET /api/viewer/posts/[slug]` 라우트 작성
- [x] `src/app/page.tsx`를 Viewer 홈으로 교체
- [x] `src/app/posts/[slug]/page.tsx` 작성(canonical, JSON-LD, 관련 글, 연관 사이트 링크)
- [x] `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/rss.xml/route.ts` 작성
- [x] `src/app/globals.css`에 본문 렌더링용 클래스 추가
- [x] `.env.example`에 `SITE_BASE_URL` 추가

## 테스트 작업

- [x] `npm run lint` 실행 및 결과 기록
- [x] `npm run build` 실행 및 결과 기록
- [x] 로컬 dev 서버로 홈/상세/sitemap/robots/rss 스모크 테스트(Confluence 자격증명 없는 상태에서 502로 명확히 응답하는지 확인)
- [x] 미검증 항목(실 Confluence 데이터 필요) 명시

## 문서화 작업

- [x] `docs/product/prd.md` Phase 3 체크리스트 상태·산출물 갱신
- [x] `docs/tasks/phase-3/test-result.md` 작성
- [x] `docs/tasks/phase-3/result.md` 작성

## 진행 상태

모든 항목 완료. 단, Confluence 실 자격증명 부재로 실제 데이터 기반 렌더링·매크로 변환 검증은 이번 범위에서 제외(test-result.md의 "미검증 항목" 참고).
