# Result — Phase 3: Viewer 핵심 기능

## 배달된 범위

`docs/product/prd.md` Phase 3(Viewer 핵심 기능) 체크리스트 7개 항목 모두, Confluence 실 자격증명 없이 완료 가능한 코드 범위를 구현했다.

## 변경/생성 파일

- `src/lib/confluence/client.ts`: `listAllSpacePages` 추가(기존 함수는 변경 없음)
- `src/lib/viewer/posts.ts`(신규): 게시 문서 목록/상세/관련 글 조회
- `src/lib/viewer/converter.ts`(신규): Confluence 컴포넌트 컨버터(code/info/note/warning/tip 매크로, 표, 최소 HTML 정제)
- `src/lib/viewer/related-sites.ts`(신규): 연관 사이트 링크 플레이스홀더
- `src/app/api/viewer/posts/route.ts`, `src/app/api/viewer/posts/[slug]/route.ts`(신규)
- `src/app/page.tsx`(교체): 플레이스홀더 → Viewer 홈(게시 문서 목록)
- `src/app/posts/[slug]/page.tsx`(신규): Viewer 문서 상세(canonical, JSON-LD, 관련 글, 연관 사이트 링크)
- `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/rss.xml/route.ts`(신규)
- `src/app/globals.css`: `.viewer-content`/`.viewer-code`/`.viewer-panel`/`.viewer-table` 클래스 추가
- `.env.example`: `SITE_BASE_URL` 추가
- `docs/product/prd.md`: Phase 3 체크리스트 상태·산출물 갱신
- `docs/tasks/phase-3/{spec.md,plan.md,tasks.md,test-result.md,result.md}`(본 문서)

## 핵심 결정

- **전체 스캔 방식 재사용**: 게시 문서 목록/상세 조회는 Phase 2의 `findPublishedPageBySlug`와 동일하게 Space의 전체 페이지를 순회하며 각 페이지의 `publishMetadata` content property를 확인하는 방식을 그대로 채택했다. 별도의 인덱스 자료구조를 새로 만들지 않았다(architecture.md가 이미 소규모 팀 기준으로 이 접근을 허용).
- **ISR로 Confluence 반복 조회 완화**: `/`, `/sitemap.xml`, `/rss.xml`에 `export const revalidate = 60`을 적용했다. 이 값이 없으면 Next.js가 빌드 시점 스냅샷을 정적으로 고정해버려(실제로 처음 구현 시 빌드 로그에서 확인함), architecture.md가 요구하는 "짧은 주기의 캐싱"과 어긋나는 문제가 있었다. `/posts/[slug]`는 `generateStaticParams`가 없어 매 요청 서버 렌더링(SSR)되며, 이는 항상 최신 Confluence 데이터를 반영하는 대신 응답이 조금 더 느릴 수 있는 트레이드오프다.
- **컴포넌트 컨버터는 정규식 기반, 신규 의존성 미도입**: Confluence storage format(XHTML)을 별도 파서 라이브러리 없이 정규식으로 변환했다(code/info/note/warning/tip 매크로, 표, 매핑되지 않는 매크로의 기본 스타일 대체). 이 저장소가 지금까지 `marked` 외 별도 파싱 의존성을 두지 않은 관행을 따랐다. 다만 정규식 기반이라 중첩된 복잡한 매크로 구조는 완전히 처리하지 못할 수 있다.
- **최소한의 방어적 HTML 정제**: 변환된 HTML을 `dangerouslySetInnerHTML`로 그대로 렌더링하므로, `<script>` 태그·인라인 이벤트 핸들러·`javascript:` 스킴을 제거하는 최소 방어 처리를 추가했다. 이는 완전한 allow-list 기반 sanitizer가 아니며, 저장 공간(Confluence)에 대한 쓰기 권한이 있는 내부 인증 사용자가 악의적으로 매크로를 조작할 경우의 위험은 남아 있다 — 향후 리스크가 커지면 별도 sanitizer 라이브러리(예: `sanitize-html`) 도입을 검토해야 한다.
- **공개 페이지에 작성자 이메일 미노출**: Document의 `actualAuthorEmail`(data-spec.md, 사내 식별용)을 Viewer의 목록/상세/JSON-LD 어디에도 노출하지 않았다. 개인정보 노출 방지 목적이다.
- **연관 사이트 링크는 URL 미기재 플레이스홀더**: requirements.md는 "회사 홈페이지와 B2C·B2B 서비스" 링크가 필요하다고만 언급하고 실제 URL을 제공하지 않아, `src/lib/viewer/related-sites.ts`에 이름만 채운 빈 URL 목록을 두었다(실제 URL이 있는 항목만 화면에 노출하도록 구현). **실제 서비스 URL은 사용자가 직접 채워 넣어야 한다.**
- **redirectFrom(주소 변경 리다이렉트)은 이번 범위 제외**: prd.md Phase 5에 별도 체크리스트 항목으로 이미 존재하여, Phase 3은 canonical URL까지만 다루고 리다이렉트 이력 관리는 다루지 않았다.

## 검증 결과

`docs/tasks/phase-3/test-result.md` 참고. `npm run lint`/`npm run build` 통과, 로컬 dev 서버로 홈·상세·sitemap·robots·rss·API 라우트를 스모크 테스트했다. Confluence 자격증명이 없어 실제 게시 문서 데이터로의 렌더링·404 처리·매크로 변환은 검증하지 못했다.

## 열린 과제(Open Gaps)

- **Confluence 서비스 계정 연동**: Phase 1의 미해결 항목과 동일하게, 실제 자격증명이 있어야 목록/상세/sitemap/RSS에 실제 데이터가 채워지는지 검증할 수 있다.
- **연관 사이트 실제 URL**: `src/lib/viewer/related-sites.ts`의 `url` 필드를 실제 값으로 채워야 화면에 노출된다.
- **HTML 정제 수준**: 현재는 최소 방어 수준이다. 공개 서비스로 트래픽이 늘어나면 정식 sanitizer 라이브러리 도입을 검토해야 한다.
- **`/posts/[slug]`의 정적 생성 미적용**: `generateStaticParams`를 추가하면 응답 속도를 더 개선할 수 있으나, 이번 범위에서는 게시 즉시 반영을 우선해 SSR로 두었다.

## Next Steps

- 사용자가 Confluence 자격증명을 준비하면, 실제 문서 게시→Viewer 노출까지의 전체 흐름을 재검증하고 prd.md 상태를 갱신할 수 있다.
- Phase 4(Comment 기능)로 이어서 진행할지, 아니면 Phase 1/2/3의 남은 실 연동 검증부터 처리할지 확인이 필요하다.
