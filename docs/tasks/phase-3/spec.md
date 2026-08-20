# Spec — Phase 3: Viewer 핵심 기능

## 문제 정의

`docs/product/prd.md`의 Phase 3(Viewer 핵심 기능)는 Editor에서 게시한 문서를 비로그인 상태로 공개 열람하고, 검색엔진에 노출될 수 있게 하는 것을 목표로 한다. 현재 저장소에는 Viewer 관련 코드가 전혀 없다(Phase 3 체크리스트 7개 항목 모두 산출물 없음).

## 비즈니스 배경

- 관련 문서: [prd.md](../../product/prd.md)(Phase 3 기능별 정의·체크리스트), [architecture.md](../../product/architecture.md), [data-spec.md](../../product/data-spec.md)(Document/Publish Metadata), [api-spec.md](../../product/api-spec.md)(`GET /api/viewer/posts`, `GET /api/viewer/posts/{slug}`, `/sitemap.xml`, `/robots.txt`, `/rss.xml`), [requirements.md](../../product/requirements.md)(SEO·관련 사이트 요구사항 원문)
- Editor(Phase 2)가 이미 Confluence content properties(`publishMetadata`)에 게시 여부·slug·metaDescription을 기록하도록 구현되어 있다(`src/lib/editor/publish.ts`). Viewer는 이 데이터를 읽기 전용으로 조회한다.

## 범위 (In Scope)

1. 게시된 문서 목록 조회(Viewer 홈)
2. 게시된 문서 상세 조회·렌더링(고유 URL `/posts/{slug}`)
3. Confluence 컴포넌트 컨버터(코드/정보 패널/표를 웹 뷰 스타일로 변환)
4. SEO 기본 대응: 고유 URL, canonical URL (주소 변경/삭제 시 리다이�드는 Phase 5 범위 — 아래 "범위 제외" 참고)
5. `sitemap.xml`, `robots.txt`, `rss.xml` 제공
6. 구조화 데이터(JSON-LD), 관련 글, 연관 사이트 링크

## 범위 제외 (Out of Scope)

- **게시 주소 변경/삭제 시 리다이렉트 처리**: prd.md Phase 5 체크리스트에 별도 항목("게시 주소 변경/삭제 시 리다이렉트 처리")으로 명시되어 있어 이번 범위에서 제외한다. 이번 Phase 3에서는 slug가 유지되는 동안의 canonical URL만 다룬다.
- **악용 방지(rate limiting)**: Phase 5 범위.
- **실제 회사 관련 사이트 URL**: requirements.md는 "회사 홈페이지와 B2C·B2B 서비스 등 관련 사이트"라고만 언급하고 실제 URL을 명시하지 않는다. 실제 URL을 알 수 없는 상태에서 임의로 URL을 만들어 넣지 않는다 — 이름만 채운 플레이스홀더 목록을 코드에 두고, 실제 URL은 사용자가 채워 넣어야 한다.
- Comment 기능(Phase 4), 운영 자동화(Phase 5)

## 사용자/운영자 시나리오

- 비로그인 방문자가 공개 URL 루트(`/`)에 접속하면 게시된 문서 목록을 볼 수 있다.
- 목록에서 문서를 클릭하거나 `/posts/{slug}`로 직접 접근하면 문서 본문, 관련 글, 연관 사이트 링크가 포함된 상세 화면을 볼 수 있다.
- 존재하지 않거나 게시 해제된 slug로 접근하면 404 응답을 받는다.
- 검색엔진 크롤러는 `/sitemap.xml`, `/robots.txt`, `/rss.xml`을 통해 게시된 문서를 발견할 수 있다.

## 완료 기준(Acceptance Criteria)

- `npm run lint`, `npm run build`가 Confluence 자격증명 없이 성공한다.
- `GET /api/viewer/posts`, `GET /api/viewer/posts/{slug}`가 api-spec.md 명세대로 구현되어 있다.
- Viewer 홈(`/`)과 문서 상세(`/posts/{slug}`) 페이지가 렌더링된다.
- `/sitemap.xml`, `/robots.txt`, `/rss.xml`이 응답한다(게시 문서가 없어도 유효한 형식으로 응답).
- 문서 상세 페이지에 canonical URL 메타 태그, JSON-LD 구조화 데이터, 관련 글, 연관 사이트 링크(플레이스홀더)가 포함되어 있다.
- Confluence 저장 포맷의 code/info/note/warning/tip 매크로와 표가 웹 뷰 스타일로 변환되고, 매핑되지 않는 매크로는 기본 스타일(내부 텍스트만 노출)로 대체된다.

## 엣지 케이스

- 게시된 문서가 하나도 없는 경우: 목록/`sitemap.xml`/`rss.xml`은 빈 상태로 유효하게 응답해야 한다.
- 존재하지 않는 slug, 또는 한때 게시되었다가 게시 해제된 slug로 접근 시 404.
- 관련 글이 없는 경우(게시 문서가 1개뿐인 경우) 관련 글 영역은 노출하지 않는다.
- 연관 사이트 링크 URL이 비어 있는 경우(플레이스홀더 상태) 해당 항목은 노출하지 않는다.
- Confluence 저장 포맷에 알 수 없는 매크로가 포함된 경우, 내부 리치 텍스트만 남기고 기본 스타일로 노출한다.

## 가정 및 미확인 사항

- **공개 표시용 저자 정보 비노출**: Document의 `actualAuthorEmail`(data-spec.md)은 사내 식별용이며, 사내 직원의 이메일을 외부 공개 페이지·구조화 데이터에 그대로 노출하지 않는다(개인정보 노출 방지). Viewer는 저자 이메일을 렌더링하지 않는다.
- **HTML 정제는 최소 수준**: Confluence storage format을 웹 HTML로 변환한 뒤 그대로 렌더링하며, `<script>` 태그·인라인 이벤트 핸들러·`javascript:` 스킴을 제거하는 최소한의 방어적 처리만 적용한다. 완전한 HTML sanitizer(allow-list 기반)는 아니며, 필요 시 별도 라이브러리 도입을 검토해야 한다.
- **`SITE_BASE_URL` 환경변수 신규 필요**: canonical URL·sitemap·RSS의 절대 URL 생성에 사용한다. 없으면 `http://localhost:3000`을 기본값으로 사용한다.
- Editor가 아직 `canonicalUrl`/`structuredDataType`/`redirectFrom`(data-spec.md에 정의됨) 필드를 게시 설정 화면에서 입력받지 않으므로, canonical URL은 slug 기반으로 자동 계산하고, `structuredDataType`은 고정값("BlogPosting")을 사용한다.
