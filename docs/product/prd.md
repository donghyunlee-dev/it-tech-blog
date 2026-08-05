# 📄 PRD — SFOOD IT Tech Blog

> 전체 진행률: 0 / 26 항목 완료 (최근 갱신: 2026-08-05)

## 🎯 서비스 정의

사내 직원 전체가 MS 계정(사내 SSO)으로 로그인하여 문서를 작성·게시하고, 게시된 문서를 누구나 Tech Blog에서 열람할 수 있도록 하는 서비스다. 자체 DB(Database) 없이 Confluence를 단일 저장소로 사용하여, 소규모 팀이 2주 이내에 빠르게 구축할 수 있는 최소 구성을 목표로 한다.

서비스는 문서 작성·게시를 담당하는 **Editor**, 게시된 문서를 노출하는 **Viewer**, Viewer에 연결되는 **Comment**로 구성한다. Editor와 Comment에서 생성한 모든 데이터는 Confluence API를 통해 저장하고 조회한다.

- 관련 문서: [requirements.md](requirements.md), [architecture.md](architecture.md)

## 🖥️ 화면 정의

| 화면 | 목적 | 주요 구성 요소 | 진입 경로 |
|---|---|---|---|
| 로그인 화면 | MS 계정(사내 SSO)으로 Editor·Comment 이용자 인증 | MS 로그인 버튼, 로그인 상태 안내 | Editor 접속 시, Comment 작성 시도 시 |
| Editor 탐색기(대시보드) | 로그인한 사용자의 개인 폴더와 문서 구조 확인 | 폴더/페이지 트리, 새 문서 작성 버튼, 최근 문서 목록 | 로그인 성공 후 첫 진입 |
| Editor 문서 편집 화면 | 문서 작성·수정, 이미지 등록 | Markdown/블록 에디터, 이미지 업로드, 저장 버튼 | 탐색기에서 문서 선택 또는 새 문서 생성 |
| Editor 게시 설정 화면 | 게시 여부, 노출 Viewer, 공개 경로·SEO 정보 설정 | 게시 토글, Viewer 선택, slug 입력, meta description 입력 | 문서 편집 화면에서 게시 진입 |
| Viewer 홈(Tech Blog) | 게시된 문서 목록과 연관 사이트 링크 노출 | 게시글 목록/카드, 정렬, 연관 사이트 링크 | 공개 URL 루트 접속 |
| Viewer 문서 상세 화면 | 게시된 문서 본문과 댓글 노출 | 본문 렌더링(컴포넌트 컨버터 적용), 관련 글, Comment 위젯 | 문서 목록에서 클릭 또는 고유 URL 직접 접근 |
| Comment 위젯 | Viewer 문서에 댓글 작성·열람 | 댓글 계층 목록, 답글 버튼, MS 로그인/외부 사용자 작성 폼 | Viewer 문서 상세 화면 하단 |

## 🛠️ 개발 스펙 정의

기술 스택과 근거는 [architecture.md](architecture.md)에 상세히 기술되어 있다. 개발 착수 전 참고할 핵심 내용은 다음과 같다.

- **프론트엔드/백엔드**: Next.js(React, TypeScript) 단일 저장소. 백엔드는 별도 서버 없이 Next.js Route Handlers(Node.js)로 구성.
- **데이터 저장**: 자체 DB 없음. Confluence REST API v2가 저장소 역할을 전담하며, Viewer 반복 조회 성능을 위해 Next.js ISR/엣지 캐시를 활용한다. 상세 데이터 구조는 [data-spec.md](data-spec.md) 참고.
- **인증**: Microsoft Entra ID(Azure AD) OIDC + Auth.js(NextAuth). Editor·Comment는 인증 필수, Viewer는 비로그인 공개.
- **Confluence 연동**: Confluence Cloud REST API v2, 프로젝트 담당자의 단일 서비스 계정 API 토큰 사용. 토큰은 서버 환경변수/시크릿 매니저에만 보관.
- **배포/CI-CD**: Vercel + GitHub Actions, main 브랜치 push 시 자동 배포. 별도 스테이징 환경 없이 PR Preview 배포로 검증.
- **운영 알림**: Confluence 연동 실패 등 이상 감지 시 Slack Incoming Webhook으로 운영팀에 알림.
- **API 상세 명세**: [api-spec.md](api-spec.md) 참고.

## 🧩 기능별 정의

### 기능 — MS SSO 로그인
- 설명: Microsoft Entra ID 기반 사내 SSO로 Editor·Comment 이용자를 인증한다.
- 입력: 사내 MS 계정 자격 증명(OIDC 로그인 플로우)
- 출력·동작: 로그인 성공 시 세션 생성, 사용자 메일/이름을 실제 작성자 정보로 사용
- 예외 상황: 인증 실패 시 로그인 화면으로 재이동 및 오류 안내
- 데이터 저장 여부: 아니오
- API 필요 여부: 예 — api-spec.md의 인증 라우트(Auth.js 표준 라우트) 참고

### 기능 — 개인 폴더 확인/생성
- 설명: 로그인한 사용자의 메일 계정을 기준으로 Confluence Space 내 개인 폴더를 확인하고, 없으면 생성한다.
- 입력: 로그인 사용자의 메일 계정
- 출력·동작: 기존 폴더 연결 또는 신규 폴더 생성 후 탐색기 화면 진입
- 예외 상황: Confluence API 호출 실패 시 오류 안내 및 이상 감지 알림 트리거
- 데이터 저장 여부: 예 — data-spec.md의 Document(개인 폴더/Space 구조)
- API 필요 여부: 예 — GET/POST `/api/editor/folder`

### 기능 — 문서 목록 조회(탐색기)
- 설명: 개인 폴더 하위 문서를 폴더/페이지 구조로 조회한다.
- 입력: 로그인 사용자의 개인 폴더 식별자
- 출력·동작: 폴더/페이지 트리 형태로 문서 목록 표시
- 예외 상황: 문서가 없을 경우 빈 상태 안내
- 데이터 저장 여부: 예 — data-spec.md의 Document
- API 필요 여부: 예 — GET `/api/editor/documents`

### 기능 — 문서 작성·저장
- 설명: Markdown, 블록 단위 편집, 이미지 등록 등을 지원하는 편집기로 신규 문서를 작성하고 Confluence 문서로 변환하여 저장한다.
- 입력: 문서 제목, 본문(Markdown/블록), 첨부 이미지
- 출력·동작: Confluence 페이지 생성, 탐색기에 반영
- 예외 상황: 저장 실패 시 편집 내용 유지 및 재시도 안내
- 데이터 저장 여부: 예 — data-spec.md의 Document
- API 필요 여부: 예 — POST `/api/editor/documents`

### 기능 — 문서 수정
- 설명: 기존 문서의 본문·제목을 수정한다.
- 입력: 문서 식별자(Confluence pageId), 변경된 본문/제목
- 출력·동작: Confluence 페이지 갱신
- 예외 상황: 동시 수정 충돌(Confluence 버전 충돌) 시 최신 버전 안내 후 재시도 요청
- 데이터 저장 여부: 예 — data-spec.md의 Document
- API 필요 여부: 예 — PUT `/api/editor/documents/{pageId}`

### 기능 — 이미지 등록
- 설명: 문서 작성·수정 중 이미지를 업로드하여 본문에 삽입한다.
- 입력: 이미지 파일
- 출력·동작: Confluence 첨부파일로 업로드 후 본문에 삽입 가능한 참조 반환
- 예외 상황: 업로드 실패 또는 허용되지 않는 파일 형식 시 오류 안내
- 데이터 저장 여부: 예 — data-spec.md의 Document(첨부파일)
- API 필요 여부: 예 — POST `/api/editor/documents/{pageId}/images`

### 기능 — 게시 상태·노출 Viewer·SEO 정보 설정
- 설명: 문서의 게시 여부, 노출할 Viewer, 공개 경로(slug), 검색·공유용 메타 정보를 설정하여 Confluence content properties에 저장한다.
- 입력: 게시 여부, 대상 Viewer, 공개 경로, meta description 등 SEO 정보
- 출력·동작: content properties 갱신, 게시 시 Viewer에서 즉시 조회 가능
- 예외 상황: 필수 SEO 정보 누락 시 게시 차단 및 안내
- 데이터 저장 여부: 예 — data-spec.md의 Publish Metadata(Content Properties)
- API 필요 여부: 예 — PATCH `/api/editor/documents/{pageId}/publish`

### 기능 — 게시 문서 목록 조회(Viewer)
- 설명: Editor에서 게시 상태로 전환된 문서만 Viewer에 목록으로 노출한다.
- 입력: 없음(공개 조회)
- 출력·동작: 게시 문서 카드/목록 렌더링
- 예외 상황: 게시 문서가 없을 경우 빈 상태 안내
- 데이터 저장 여부: 예 — data-spec.md의 Document, Publish Metadata
- API 필요 여부: 예 — GET `/api/viewer/posts`

### 기능 — 게시 문서 상세 조회·렌더링
- 설명: 게시된 문서 본문을 고유 URL로 제공하고, 검색엔진이 읽을 수 있도록 서버에서 HTML로 렌더링한다.
- 입력: 문서 slug(공개 경로)
- 출력·동작: 서버 렌더링된 문서 상세 페이지 반환
- 예외 상황: 존재하지 않거나 게시 해제된 문서 접근 시 404 또는 안내 페이지 처리
- 데이터 저장 여부: 예 — data-spec.md의 Document, Publish Metadata
- API 필요 여부: 예 — GET `/api/viewer/posts/{slug}`

### 기능 — Confluence 컴포넌트 컨버터
- 설명: Confluence에서 인식되는 컴포넌트(코드 블록, 표, 정보 패널 등)를 웹 뷰 CSS에 맞게 변환하여 노출한다.
- 입력: Confluence 문서 본문(스토리지 포맷)
- 출력·동작: 웹 뷰용 HTML/CSS로 변환된 본문
- 예외 상황: 매핑되지 않는 컴포넌트는 기본 스타일로 대체 노출
- 데이터 저장 여부: 아니오
- API 필요 여부: 아니오(Viewer 서버 렌더링 내부 로직)

### 기능 — SEO 기본 대응(고유 URL·canonical·리다이렉트)
- 설명: 문서마다 변하지 않는 고유 URL과 canonical URL을 제공하고, 주소 변경·삭제 시 적절한 페이지로 리다이렉트한다.
- 입력: 문서 slug, 변경 이력
- 출력·동작: canonical 태그 삽입, 변경/삭제된 주소는 리다이렉트 처리
- 예외 상황: 리다이렉트 대상이 없을 경우 안내 페이지로 연결
- 데이터 저장 여부: 예 — data-spec.md의 Publish Metadata
- API 필요 여부: 아니오(Viewer 라우팅 내부 로직)

### 기능 — sitemap.xml·robots.txt·RSS 제공
- 설명: 게시된 문서를 검색엔진이 발견할 수 있도록 sitemap.xml, robots.txt, RSS를 생성한다.
- 입력: 게시 문서 목록
- 출력·동작: `/sitemap.xml`, `/robots.txt`, `/rss.xml` 응답 생성
- 예외 상황: 게시 문서가 없을 경우 빈 목록으로 유효한 XML 반환
- 데이터 저장 여부: 예 — data-spec.md의 Document, Publish Metadata
- API 필요 여부: 예 — GET `/sitemap.xml`, GET `/robots.txt`, GET `/rss.xml`

### 기능 — 구조화 데이터·관련 글·연관 사이트 링크
- 설명: 검색 결과 및 외부 공유에 필요한 구조화 데이터(JSON-LD)를 제공하고, 게시글 간 관련 글과 회사 관련 사이트 링크를 노출한다.
- 입력: 문서 메타데이터, 관련 문서 목록, 연관 사이트 목록
- 출력·동작: 문서 상세 화면에 구조화 데이터·관련 글·연관 사이트 링크 삽입
- 예외 상황: 관련 글이 없을 경우 해당 영역 미노출
- 데이터 저장 여부: 예 — data-spec.md의 Publish Metadata
- API 필요 여부: 아니오(Viewer 렌더링 내부 로직)

### 기능 — MS 로그인 사용자 댓글 작성
- 설명: 사내 직원이 MS 로그인 상태에서 댓글을 작성한다.
- 입력: 댓글 본문, 로그인 세션(작성자 정보)
- 출력·동작: Confluence Comment로 저장(실제 작성자 정보 구조화 포함)
- 예외 상황: 세션 만료 시 재로그인 안내
- 데이터 저장 여부: 예 — data-spec.md의 Comment
- API 필요 여부: 예 — POST `/api/comments`

### 기능 — 외부 사용자 댓글 작성
- 설명: 로그인하지 않은 외부 사용자가 이름·이메일을 입력하여 댓글을 작성한다.
- 입력: 사용자명, 이메일, 댓글 본문
- 출력·동작: 필수값 검증 후 Confluence Comment로 구조화 저장(이름 | 이메일 | 댓글)
- 예외 상황: 이름·이메일 누락 또는 형식 오류 시 저장 차단 및 안내
- 데이터 저장 여부: 예 — data-spec.md의 Comment
- API 필요 여부: 예 — POST `/api/comments`

### 기능 — 대댓글 및 댓글 계층 조회
- 설명: 일반 댓글과 대댓글을 Comment ID/parentCommentId 관계로 구성하고, 재귀적으로 따라가 전체 댓글 계층을 노출한다.
- 입력: 문서 식별자, (대댓글인 경우) 부모 Comment ID
- 출력·동작: 계층형 댓글 목록 반환
- 예외 상황: 부모 댓글이 삭제된 경우에도 하위 댓글 계층은 유지
- 데이터 저장 여부: 예 — data-spec.md의 Comment(자기 참조 관계)
- API 필요 여부: 예 — GET `/api/comments`

### 기능 — 댓글 조회 성능 최적화
- 설명: 댓글 수·계층이 늘어나 조회 속도가 저하될 경우, 전체 댓글을 한 번에 조회한 뒤 메모리에서 계층을 구성하는 방식으로 전환한다.
- 입력: 문서 식별자
- 출력·동작: 사용자에게 노출되는 댓글 계층·답글 관계는 기존과 동일하게 유지
- 예외 상황: 없음(내부 조회 전략 전환)
- 데이터 저장 여부: 아니오(조회 방식 개선)
- API 필요 여부: 아니오(기존 `/api/comments` 내부 구현 개선)

### 기능 — 이상 감지 → Slack 알림
- 설명: Confluence API 호출 실패(게시 실패, 인증 만료, rate limit 초과), 댓글 저장 실패, 외부 사용자의 비정상적 반복 요청 등을 서버에서 감지하여 Slack Webhook으로 운영팀에 전달한다.
- 입력: 서버 내부 오류·이상 이벤트
- 출력·동작: Slack 채널에 알림 메시지 전송
- 예외 상황: Slack Webhook 자체 실패 시 서버 로그에 기록
- 데이터 저장 여부: 아니오
- API 필요 여부: 아니오(서버 내부에서 Slack Webhook 직접 호출)

## 🗺️ 단계별 개발 계획

### Phase 1 — 기반 설정
- 목표: 로그인·Confluence 연동·배포 파이프라인 등 이후 모든 기능 개발의 전제 조건을 갖춘다.
- 포함 기능: MS SSO 로그인(연동 준비)

### Phase 2 — Editor 핵심 기능
- 목표: 사내 직원이 문서를 작성·수정·게시 설정할 수 있게 한다.
- 포함 기능: 개인 폴더 확인/생성, 문서 목록 조회(탐색기), 문서 작성·저장, 문서 수정, 이미지 등록, 게시 상태·노출 Viewer·SEO 정보 설정

### Phase 3 — Viewer 핵심 기능
- 목표: 게시된 문서를 공개 열람하고 검색엔진에 노출할 수 있게 한다.
- 포함 기능: 게시 문서 목록 조회, 게시 문서 상세 조회·렌더링, Confluence 컴포넌트 컨버터, SEO 기본 대응, sitemap.xml·robots.txt·RSS 제공, 구조화 데이터·관련 글·연관 사이트 링크

### Phase 4 — Comment 기능
- 목표: MS 로그인 사용자와 외부 사용자 모두 댓글을 작성하고 계층 구조로 열람할 수 있게 한다.
- 포함 기능: MS 로그인 사용자 댓글 작성, 외부 사용자 댓글 작성, 대댓글 및 댓글 계층 조회, 댓글 조회 성능 최적화

### Phase 5 — 운영 자동화 및 마무리
- 목표: 운영 이상 감지 체계를 갖추고 전체 기능을 통합 검증하여 서비스를 안정적으로 배포한다.
- 포함 기능: 이상 감지 → Slack 알림, (Viewer SEO 기능에 포함된) 리다이렉트 처리 마무리, 악용 방지(rate limiting) 적용, 통합 QA

## ✅ 단계별 진행 체크리스트

### Phase 1 — 기반 설정
- [ ] (대기) Next.js 프로젝트 초기 설정 및 GitHub Actions + Vercel CI/CD 구성 — 산출물: (없음)
- [ ] (대기) Microsoft Entra ID OIDC + Auth.js(NextAuth) 로그인 연동 — 산출물: (없음)
- [ ] (대기) Confluence 서비스 계정 API 토큰 발급 및 연결 확인 — 산출물: (없음)
- [ ] (대기) Slack Incoming Webhook 채널 연결 확인 — 산출물: (없음)
- [ ] (대기) 환경변수/시크릿 관리 체계 구성 — 산출물: (없음)

### Phase 2 — Editor 핵심 기능
- [ ] (대기) 로그인 사용자 개인 폴더 확인/생성 구현 — 산출물: (없음)
- [ ] (대기) 문서 탐색기(폴더/페이지 트리) 조회 화면 구현 — 산출물: (없음)
- [ ] (대기) 문서 작성·저장 기능(Markdown/블록 편집기) 구현 — 산출물: (없음)
- [ ] (대기) 문서 수정 기능 구현 — 산출물: (없음)
- [ ] (대기) 이미지 등록 기능 구현 — 산출물: (없음)
- [ ] (대기) 게시 상태·노출 Viewer·공개 경로/SEO 메타 설정 기능 구현 — 산출물: (없음)

### Phase 3 — Viewer 핵심 기능
- [ ] (대기) 게시 문서 목록 조회 화면 구현 — 산출물: (없음)
- [ ] (대기) 게시 문서 상세 조회·렌더링 구현 — 산출물: (없음)
- [ ] (대기) Confluence 컴포넌트 컨버터(CSS 매칭) 구현 — 산출물: (없음)
- [ ] (대기) 고유 URL/canonical URL 처리 구현 — 산출물: (없음)
- [ ] (대기) sitemap.xml, robots.txt 생성 구현 — 산출물: (없음)
- [ ] (대기) RSS 피드 생성 구현 — 산출물: (없음)
- [ ] (대기) 구조화 데이터(JSON-LD) 및 관련 글/연관 사이트 링크 구현 — 산출물: (없음)

### Phase 4 — Comment 기능
- [ ] (대기) MS 로그인 사용자 댓글 작성 구현 — 산출물: (없음)
- [ ] (대기) 외부 사용자(이름·이메일) 댓글 작성 구현 — 산출물: (없음)
- [ ] (대기) 대댓글 및 댓글 계층 조회(재귀적 parentCommentId) 구현 — 산출물: (없음)
- [ ] (대기) 댓글 조회 성능 최적화(전체 조회 후 계층 구성 전환 검토) — 산출물: (없음)

### Phase 5 — 운영 자동화 및 마무리
- [ ] (대기) Confluence 연동 실패 등 이상 감지 → Slack 알림 연동 — 산출물: (없음)
- [ ] (대기) 게시 주소 변경/삭제 시 리다이렉트 처리 — 산출물: (없음)
- [ ] (대기) 외부 댓글 작성 엔드포인트 rate limiting 적용 — 산출물: (없음)
- [ ] (대기) 전체 통합 QA 및 PR Preview 배포 검증 — 산출물: (없음)

## 🗄️ 데이터 저장 여부
있음 — 자체 DB는 두지 않으며 Confluence를 저장소로 사용한다. 상세 데이터 구조는 [data-spec.md](data-spec.md) 참고.

## 🔌 API 여부
필요 — Next.js Route Handlers 기반 자체 API와 Confluence API 연동이 필요하다. 상세 명세는 [api-spec.md](api-spec.md) 참고.
