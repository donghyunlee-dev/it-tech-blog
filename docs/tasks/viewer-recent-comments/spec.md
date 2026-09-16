# spec — 사이드바 "최근 댓글" 실데이터

## 문제 정의

홈 화면 사이드바 `RecentCommentsSidebar`(design-direction.md 시그니처 요소 — 랭킹 대신 "공유와 전달"을 보여주는 자리)는 컴포넌트만 만들어져 있고 항상 빈 배열이 전달되어 렌더링되지 않는다([viewer-editorial-ui/result.md](../viewer-editorial-ui/result.md)의 열린 과제). 전체 게시글에 걸친 댓글을 최신순으로 모으는 조회 로직이 없기 때문이다.

## 조사

Confluence REST API v2는 문서(페이지) 단위 댓글 조회(`GET /pages/{id}/footer-comments`)만 제공하고 스페이스 전체를 가로지르는 댓글 조회 엔드포인트는 없다(기존 `listFooterComments` 구현 확인). architecture.md/data-spec.md는 이 서비스를 "소규모 팀(2~10명)" 규모로 전제하므로, 게시 문서 각각에 대해 댓글을 조회한 뒤 메모리에서 합쳐 최신순 정렬하는 방식으로 충분하다(현재 게시 문서 3건 수준).

## 범위 (In Scope)

1. `src/lib/comments/comments.ts`에 `listRecentComments(limit)` 추가 — 게시된 모든 문서의 댓글을 조회해 최신순으로 합치고 상위 N개만 반환.
2. `src/app/page.tsx`에서 이를 호출해 `RecentCommentsSidebar`에 실제 데이터를 전달.
3. 댓글 본문은 사이드바에 맞게 짧게 자른다(전체 문단을 그대로 넣으면 디자인이 의도한 "인용 한 줄" 느낌이 깨짐).

## Out of Scope

- 답글(대댓글)과 최상위 댓글을 구분해 계층으로 보여주는 것 — 사이드바는 "지금 오가는 이야기"를 보여주는 목적이라 계층 없이 평면적으로 최신순만 다룬다.
- 실시간 갱신(웹소켓 등) — 기존과 동일하게 ISR 60초 캐시에 의존한다.

## 수용 기준

- [ ] 실제 댓글이 있으면 사이드바에 작성자·인용문·글 제목이 최신순으로 노출된다.
- [ ] 댓글이 하나도 없으면 사이드바 자체가 렌더링되지 않는다(기존 "있으면 보너스" 원칙 유지).
- [ ] 특정 게시글의 댓글 조회가 실패해도 다른 게시글의 댓글로 사이드바가 정상 동작한다(부분 실패에 안전).
- [ ] `npm run lint`/`npm run build` 통과.
