# UI 벤치마킹 — 콘텐츠 목록 · 검색 · 댓글

## 목적

`design-system.md`(색상·타이포그래피·라운드·그림자 등 비주얼 언어)를 보완하기 위해, Tech Blog(Viewer)에 실제로 들어가는 3가지 기능 — **콘텐츠 목록/카드**, **검색 영역**, **댓글 구성** — 의 UI 구조를 외부 사례에서 벤치마킹했다. 여기서 정리한 "구조/레이아웃 패턴"은 이후 디자인 토큰이 확정되면 그 토큰(색상, spacing, radius, type scale)을 입혀 실제 화면으로 옮기는 것을 전제로 한다.

이 문서는 시각적 브랜드(색상 톤)가 아니라 **기능적 구조**를 벤치마킹 기준으로 삼는다 — 즉 "예쁜 사이트"가 아니라 "우리 기능과 같은 기능을 어떻게 구조화했는가"를 본다.

- 관련 문서: [design-system.md](design-system.md), [../product/prd.md](../product/prd.md), [design-system-adoption.md](design-system-adoption.md)(사내 디자인 시스템 `@sfood/ui` 적용 가능성 검토 — 이 문서의 벤치마킹 결과가 실제 컴포넌트로 이미 존재하는지 확인한 후속 문서)
- 목업 파일: [mockups/blog-ui-benchmark.html](mockups/blog-ui-benchmark.html)(정적 HTML 목업 — `@sfood/ui` 적용 검토 후에는 실제 컴포넌트 기반으로 재작성 예정)

## 조사 범위

- Awwwards: `Magazine/Newspaper/Blog` 카테고리, `Clean`/`Minimal` 태그, `Inspiration`(Elements) 개별 컴포넌트, 큐레이션 컬렉션
- Dribbble: `blog list`, `search bar ui`, `comment section` 검색 결과의 개별 shot
- 실제 서비스: 토스 기술 블로그(toss.tech), 우아한형제들 기술블로그(techblog.woowahan.com), dev.to

## 1. 콘텐츠 목록/카드

| 출처 | 참고 | 구조 |
|---|---|---|
| 우아한형제들 기술블로그 | techblog.woowahan.com | 날짜 + 작성자(복수 가능) + 굵은 제목 + 1~2줄 요약이 구분선 없이 반복되는 담백한 리스트. 사이드바에 태그별 게시글 수(`AI (21)`)를 보여주는 태그 클라우드, 하단 페이지네이션 |
| 토스 기술 블로그 | toss.tech | 카테고리 pill + 썸네일 + 제목 + 2줄 요약을 넉넉한 여백으로 나열, 사이드바에 "인기 있는 글" 랭킹 병행 |
| Dribbble — [Job Search Platform: Blog List](https://dribbble.com/shots/16366821-Job-Search-Platform-Blog-List) | Shreyash Barot | "Read Our Latest Blogs" 헤더 + 카테고리 pill 필터 → 3열 카드(이미지 상단, 제목+설명+"Read More") |
| Awwwards — [Intelligent search tool and result page](https://www.awwwards.com/inspiration/intelligent-search-tool-and-result-page-good-is-the-new-cool) 하단 "Explore Articles" | Good is the New Cool | 썸네일 + 굵은 제목 + "ARTICLE" 라벨 + 화살표 아이콘의 3열 카드 |

**채택 방향**: 썸네일 상단 + 태그 배지 + 제목(굵게) + 2줄 요약 + 메타(날짜/작성자)로 구성된 카드형 3열 그리드. 상단에 카테고리 pill 필터 바(우아한형제들 방식), 카드는 `design-system.md`의 20px 라운드 + 3-layer 그림자를 적용.

## 2. 검색 영역

| 출처 | 참고 | 구조 |
|---|---|---|
| 토스 기술 블로그 | toss.tech | 검색 아이콘 클릭 → 전체 화면 오버레이. 중앙에 둥근 테두리 입력창 하나만 배치, 타이핑 즉시 아래로 제목(굵게)+2줄 설명+오른쪽 썸네일 형태의 결과 리스트 노출 |
| Dribbble — [Search Bar UI: Liquid Glass](https://dribbble.com/shots/26138602-Search-Bar-UI-Design-Liquid-Glass) | DevDock | 플로팅 라운드 검색창(돋보기 아이콘 + 플레이스홀더 + 단축키 힌트) 아래 최근/추천 리스트 드롭다운 — 커맨드 팔레트 스타일 |
| Awwwards — [Intelligent search tool and result page](https://www.awwwards.com/inspiration/intelligent-search-tool-and-result-page-good-is-the-new-cool) | Good is the New Cool | 검색 결과 자체를 하나의 화면으로 구성 — 큰 타이틀 + 결과 수, "New search" 재검색 입력창, 바로 아래 결과 카드 리스트로 연결 |

**채택 방향**: 헤더의 검색 아이콘 클릭 시 화면 전체를 덮는 오버레이(토스 패턴)로 진입 → 중앙 정렬된 라운드 입력창 → 타이핑 즉시 하단에 결과 리스트(제목 굵게 + 요약 2줄 + 썸네일)를 보여준다. 별도 검색 결과 페이지 이동 없이 오버레이 안에서 완결되는 구조로, 우리 서비스처럼 화면 수가 적은 경우에 적합하다.

## 3. 댓글 구성

| 출처 | 참고 | 구조 |
|---|---|---|
| Dribbble — [Comment Section](https://dribbble.com/shots/25299435-Comment-Section) | Rener Aljustyo | 입력창(첨부/이미지/이모지 툴바 + 라운드 "Post" 버튼) → `Comments 56` + 정렬(`Most Recent ▾`) → 아바타/이름/시간 + 좋아요·답글 수 + `Reply(2) ⌃`로 대댓글 펼치기, 대댓글은 들여쓰기 |
| Dribbble — [Comment section](https://dribbble.com/shots/20905560-Comment-section) | Flowbite | `Discussion (20)` + Subscribe, 리치텍스트 에디터, 댓글 카드에 업/다운보트, `Edited on` 배지 — **Tailwind 컴포넌트 코드 제공**, 구현 참고 가능 |
| Dribbble — [Comment Section UI](https://dribbble.com/shots/25476473-Comment-Section-UI) | Leonard Victor | 화이트 라운드 카드, `Add a comment...` + 라운드 pill 제출 버튼, `Comments (32)`, 👍👎 + Reply, `Replies ⌃`로 들여쓰기 된 대댓글 |
| dev.to | dev.to | `Top comments (15)` + 마크다운 에디터(Preview 탭) → 작성 후 아바타+닉네임+날짜+본문+답글 계층 구성, 댓글 알림 구독(Subscribe) 토글 |
| 토스 기술 블로그 | toss.tech | 닉네임 기반의 단순 댓글, 하단에 "댓글 관련 문의: 이메일" 안내 — 사내 블로그다운 디테일 |

**채택 방향**: 상단에 댓글 입력 카드("MS 계정으로 댓글 작성" 버튼 또는 이름/이메일 입력 + 댓글 입력) → `댓글 N개` 헤더 → 댓글 리스트(아바타/이름/시간 + 본문 + 답글 버튼) → 답글은 왼쪽 들여쓰기로 계층 표시, `답글 보기(N)` 토글로 접고 펼치기. PRD의 "MS 로그인 사용자 + 외부 사용자 댓글, 대댓글 계층 조회" 요구사항과 구조적으로 가장 가까웠던 Dribbble 3건(Rener Aljustyo / Flowbite / Leonard Victor)의 요소를 조합했다.

> **화면 경계 주의**: PRD의 화면 정의상 댓글은 "문서 상세 화면" 하단에만 존재하며, "Tech Blog 홈"(목록 화면)에는 댓글이 없다. 목업(`mockups/blog-ui-benchmark.html`)도 이 둘을 별개 화면(탭)으로 분리해 구성했다 — 목록 카드 바로 아래에 댓글이 이어지는 배치는 실제 화면 구조를 오해하게 만들 수 있어 지양한다.

## 다음 단계

1. `design-system.md`를 디자인 토큰(색상/스페이싱/라운드/타입 스케일 변수 세트)으로 정리·확정한다.
2. 확정된 토큰을 이 문서에서 채택한 구조([mockups/blog-ui-benchmark.html](mockups/blog-ui-benchmark.html))에 적용해 실제 컴포넌트/화면으로 옮긴다.
3. 목업은 구조 검증용 정적 HTML이며, 실제 구현은 Next.js 컴포넌트로 별도 작업한다.
