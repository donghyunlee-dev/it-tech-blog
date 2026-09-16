# 📄 PRD — SFOOD IT Tech Blog

> 구조 변경(2026-08-19~20): Editor와 Viewer(Tech Blog)를 **별도로 개발·배포되는 두 개의 서비스**로 재구성했다. Editor 코드는 별도 저장소(`sfood-it-editor`)로 이관 완료했고, 이 저장소는 **Viewer(Tech Blog) 전용**으로 정리했다. 이관 상세 이력은 [phase-migration-editor-separation/result.md](../tasks/phase-migration-editor-separation/result.md) 참고.
>
> **이 문서(PRD)의 범위(2026-09-11 정리)**: Editor는 이제 완전히 별도 저장소에서 독립적으로 기획·개발되므로, 이 저장소의 PRD는 **Viewer(Tech Blog) 관점**을 중심으로 다룬다. Editor의 화면 구성·기능 상세·Phase별 진행 상황은 Editor 저장소 자체 문서에서 관리하며, 이 문서에는 Viewer가 알아야 하는 접점(Confluence에 Editor가 남기는 데이터 구조 등)만 요약해 남긴다. 과거 통합 저장소 시절 기록된 Editor 상세 내용·이관 체크리스트는 [phase-migration-editor-separation/result.md](../tasks/phase-migration-editor-separation/result.md)와 `docs/tasks/phase-e1-e2-editor-login-crud/`, `docs/tasks/phase-e3-editor-ops-alert/`에 참고용 이력으로 남아 있다.

## 🎯 서비스 정의

사내 직원이 로그인 후 문서를 작성·관리하는 사내 전용 도구 **Editor**와, 게시된 문서를 누구나 열람할 수 있는 공개 **Tech Blog(Viewer)**를 별도의 두 서비스로 구성한다.

- **Editor**: 사내 IT 담당자·AX팀 전용 애플리케이션. 앱의 메인 진입점이 로그인 화면이며, 로그인하지 않으면 어떤 화면도 사용할 수 없다. Confluence를 직접 컨트롤(문서 생성·수정·이미지 등록·게시 상태 설정)하는 콘텐츠 관리 도구다.
- **Tech Blog(Viewer)**: 누구나 비로그인으로 열람 가능한 공개 블로그. **디자인과 문서 표현(가독성, SEO, 렌더링 품질)이 핵심**이며, 문서를 작성하는 기능은 없다. **Comment 기능을 포함**하되, 댓글을 작성하려는 시점에만 AX Auth 로그인을 일시적으로 사용해 Confluence에 댓글을 저장한다. 그 외 열람은 모두 비로그인으로 동작한다.

두 서비스는 별도로 개발·배포되며, **Confluence를 유일한 공유 저장소**로 사용해 Editor가 작성·게시한 문서를 Tech Blog가 읽어 노출한다. 서로 API를 직접 호출하지 않는다.

- 관련 문서: [requirements.md](requirements.md), [architecture.md](architecture.md), [login-integration-guide.md](login-integration-guide.md), [mail-integration-guide.md](mail-integration-guide.md)

## 🖥️ 화면 정의

### Editor 서비스 화면 (참고 — 별도 저장소에서 관리)

Editor는 `sfood-it-editor` 저장소에서 독립 개발된다. 로그인 화면(메인 진입점)·탐색기·문서 편집 화면·게시 설정 화면으로 구성되며, 각 화면의 상세 기획·UI는 Editor 저장소 자체 문서에서 관리한다. 이 저장소(Viewer)가 알아야 할 것은 Editor가 게시 설정 화면에서 Confluence content properties에 남기는 데이터 구조뿐이며, 상세는 [data-spec.md](data-spec.md)의 Publish Metadata 참고.

### Tech Blog(Viewer) 서비스 화면

| 화면 | 목적 | 주요 구성 요소 | 진입 경로 |
|---|---|---|---|
| Tech Blog 홈 | 게시된 문서 목록과 연관 사이트 링크 노출 | 게시글 목록/카드, 정렬, 연관 사이트 링크 | 공개 URL 루트 접속(비로그인) |
| 문서 상세 화면 | 게시된 문서 본문과 댓글 노출 | 본문 렌더링(컴포넌트 컨버터 적용), 관련 글, Comment 위젯 | 문서 목록에서 클릭 또는 고유 URL 직접 접근(비로그인) |
| Comment 위젯(문서 상세 하단) | 댓글 계층 열람·작성 | 댓글 계층 목록, 답글 버튼, 작성 폼, "MS 계정으로 댓글 작성" 버튼(로그인 트리거) | 문서 상세 화면 하단 |

> Tech Blog에는 별도의 "로그인 화면"이 존재하지 않는다. AX Auth 로그인은 댓글 작성 버튼을 눌렀을 때만 인라인으로 트리거되고, 완료되면 다시 문서 상세 화면으로 돌아온다.

## 🛠️ 개발 스펙 정의

기술 스택과 근거는 [architecture.md](architecture.md)에 상세히 기술되어 있다. 개발 착수 전 참고할 핵심 내용은 서비스별로 다음과 같다.

### Editor 서비스 (참고 — 별도 저장소 `sfood-it-editor`)

Next.js(React, TypeScript) 기반의 독립된 애플리케이션으로, Confluence REST API v2에 문서·게시 메타데이터를 직접 쓴다(자체 DB 없음). 앱 전체가 AX Auth 경유 로그인 필수이며, Editor 전용 도메인으로 독립 배포된다. 기술 스펙·환경변수·CI/CD 등 세부 사항은 Editor 저장소 자체 문서에서 관리한다. Viewer가 참고해야 할 공유 데이터 구조는 [data-spec.md](data-spec.md) 참고.

### Tech Blog(Viewer) 서비스

- **프론트엔드/백엔드**: Next.js(React, TypeScript) — Editor와 별도의 저장소/애플리케이션. SEO를 위한 서버 렌더링(SSR/ISR)에 집중.
- **데이터 저장**: 자체 DB 없음. Confluence REST API v2를 **읽기 전용**으로 조회(댓글만 예외적으로 쓰기). 반복 조회 성능을 위해 Next.js ISR/엣지 캐시를 활용한다. 상세 데이터 구조는 [data-spec.md](data-spec.md) 참고.
- **인증**: 열람 자체는 비로그인. **댓글 작성 시에만** AX Auth 로그인을 트리거해 Auth.js(NextAuth) 세션을 일시적으로 생성한다. 연동 상세는 [login-integration-guide.md](login-integration-guide.md) 참고.
- **댓글 알림 메일**: 댓글 작성 시 문서 작성자에게 보내는 알림 메일 발송에 AX Auth 메일 발송 기능을 사용한다. 발신자는 로그인한 댓글 작성자, 수신자는 문서 작성자 이메일이며, MS 로그인 사용자 댓글에만 적용된다. 연동 방식·제약 사항은 [mail-integration-guide.md](mail-integration-guide.md) 참고.
- **Confluence 연동**: Confluence Cloud REST API v2, Editor와 동일한 단일 서비스 계정 API 토큰 사용(읽기 위주 + 댓글 쓰기).
- **배포/CI-CD**: 검색엔진 노출이 필요한 공개 도메인으로 독립 배포. Vercel + GitHub Actions.
- **운영 알림**: Viewer 자신의 Confluence 연동 실패(게시 문서 조회 실패, 댓글 저장 실패 등) 감지 시 Slack Incoming Webhook으로 운영팀에 알림.

공통: 두 서비스 모두 별도 스테이징 환경 없이 PR Preview 배포로 검증한다. 이 저장소(Viewer)의 API 상세 명세는 [api-spec.md](api-spec.md) 참고 — Editor API는 Editor 저장소에서 별도로 관리한다.

## 🧩 기능별 정의

### Editor 서비스 기능 (참고 — 별도 저장소 `sfood-it-editor`에서 개발)

MS SSO 로그인(메인 진입점), 개인 폴더 확인/생성, 문서 목록 조회(탐색기), 문서 작성·저장·수정·삭제, 이미지 등록, 게시 상태·노출 Viewer·SEO 정보 설정, 이상 감지 → Slack 알림 기능을 제공한다. 각 기능의 상세 정의·입출력·API·예외 처리는 Editor 저장소 자체 문서에서 관리한다. 이 저장소(Viewer)는 Editor가 게시 시 Confluence content properties에 남기는 데이터 구조([data-spec.md](data-spec.md)의 Publish Metadata)만 접점으로 참고한다.

### Tech Blog(Viewer) 서비스 기능

#### 기능 — 게시 문서 목록 조회
- 설명: Editor에서 게시 상태로 전환된 문서만 Tech Blog에 목록으로 노출한다.
- 입력: 없음(공개 조회)
- 출력·동작: 게시 문서 카드/목록 렌더링
- 예외 상황: 게시 문서가 없을 경우 빈 상태 안내
- 데이터 저장 여부: 예 — data-spec.md의 Document, Publish Metadata(읽기 전용)
- API 필요 여부: 예 — GET `/api/viewer/posts`

#### 기능 — 게시 문서 상세 조회·렌더링
- 설명: 게시된 문서 본문을 고유 URL로 제공하고, 검색엔진이 읽을 수 있도록 서버에서 HTML로 렌더링한다.
- 입력: 문서 slug(공개 경로)
- 출력·동작: 서버 렌더링된 문서 상세 페이지 반환
- 예외 상황: 존재하지 않거나 게시 해제된 문서 접근 시 404 또는 안내 페이지 처리
- 데이터 저장 여부: 예 — data-spec.md의 Document, Publish Metadata(읽기 전용)
- API 필요 여부: 예 — GET `/api/viewer/posts/{slug}`

#### 기능 — Confluence 컴포넌트 컨버터
- 설명: Confluence에서 인식되는 컴포넌트(코드 블록, 표, 정보 패널 등)를 웹 뷰 CSS에 맞게 변환하여 노출한다. Tech Blog는 디자인·문서 표현이 핵심 가치이므로 이 기능의 완성도가 중요하다.
- 입력: Confluence 문서 본문(스토리지 포맷)
- 출력·동작: 웹 뷰용 HTML/CSS로 변환된 본문
- 예외 상황: 매핑되지 않는 컴포넌트는 기본 스타일로 대체 노출
- 데이터 저장 여부: 아니오
- API 필요 여부: 아니오(Viewer 서버 렌더링 내부 로직)

#### 기능 — SEO 기본 대응(고유 URL·canonical·리다이렉트)
- 설명: 문서마다 변하지 않는 고유 URL과 canonical URL을 제공하고, 주소 변경·삭제 시 적절한 페이지로 리다이렉트한다.
- 입력: 문서 slug, 변경 이력
- 출력·동작: canonical 태그 삽입, 변경/삭제된 주소는 리다이렉트 처리
- 예외 상황: 리다이렉트 대상이 없을 경우 안내 페이지로 연결
- 데이터 저장 여부: 예 — data-spec.md의 Publish Metadata
- API 필요 여부: 아니오(Viewer 라우팅 내부 로직)

#### 기능 — sitemap.xml·robots.txt·RSS 제공
- 설명: 게시된 문서를 검색엔진이 발견할 수 있도록 sitemap.xml, robots.txt, RSS를 생성한다.
- 입력: 게시 문서 목록
- 출력·동작: `/sitemap.xml`, `/robots.txt`, `/rss.xml` 응답 생성
- 예외 상황: 게시 문서가 없을 경우 빈 목록으로 유효한 XML 반환
- 데이터 저장 여부: 예 — data-spec.md의 Document, Publish Metadata(읽기 전용)
- API 필요 여부: 예 — GET `/sitemap.xml`, GET `/robots.txt`, GET `/rss.xml`

#### 기능 — 구조화 데이터·관련 글·연관 사이트 링크
- 설명: 검색 결과 및 외부 공유에 필요한 구조화 데이터(JSON-LD)를 제공하고, 게시글 간 관련 글과 회사 관련 사이트 링크를 노출한다.
- 입력: 문서 메타데이터, 관련 문서 목록, 연관 사이트 목록
- 출력·동작: 문서 상세 화면에 구조화 데이터·관련 글·연관 사이트 링크 삽입
- 예외 상황: 관련 글이 없을 경우 해당 영역 미노출
- 데이터 저장 여부: 예 — data-spec.md의 Publish Metadata(읽기 전용)
- API 필요 여부: 아니오(Viewer 렌더링 내부 로직)

#### 기능 — MS 로그인 사용자 댓글 작성(Comment)
- 설명: 방문자가 댓글 작성 버튼을 누르면 그 시점에 AX Auth 로그인을 거쳐, 로그인 상태로 댓글을 작성한다. Tech Blog 열람 자체는 로그인이 필요 없으며, 이 기능에서만 일시적으로 로그인이 트리거된다.
- 입력: 댓글 본문, 로그인 세션(작성자 정보)
- 출력·동작: Confluence Comment로 저장(실제 작성자 정보 구조화 포함)
- 예외 상황: 로그인 실패·취소 시 댓글 작성 취소, 안내 문구 노출
- 데이터 저장 여부: 예 — data-spec.md의 Comment
- API 필요 여부: 예 — POST `/api/comments`

#### 기능 — 외부 사용자 댓글 작성
- 설명: 로그인하지 않은 외부 사용자가 이름·이메일을 입력하여 댓글을 작성한다.
- 입력: 사용자명, 이메일, 댓글 본문
- 출력·동작: 필수값 검증 후 Confluence Comment로 구조화 저장(이름 | 이메일 | 댓글)
- 예외 상황: 이름·이메일 누락 또는 형식 오류 시 저장 차단 및 안내
- 데이터 저장 여부: 예 — data-spec.md의 Comment
- API 필요 여부: 예 — POST `/api/comments`

#### 기능 — 대댓글 및 댓글 계층 조회(성능 최적화 포함)
- 설명: 일반 댓글과 대댓글을 Comment ID/parentCommentId 관계로 구성하고, 전체 댓글을 한 번에 조회한 뒤 메모리에서 계층을 구성하여 노출한다.
- 입력: 문서 식별자, (대댓글인 경우) 부모 Comment ID
- 출력·동작: 계층형 댓글 목록 반환
- 예외 상황: 부모 댓글이 삭제된 경우에도 하위 댓글 계층은 유지(최상위로 승격)
- 데이터 저장 여부: 예 — data-spec.md의 Comment(자기 참조 관계)
- API 필요 여부: 예 — GET/POST `/api/comments`

#### 기능 — 댓글 알림 메일 발송
- 설명: MS 로그인 사용자가 댓글을 작성하면 해당 문서(블로그 글) 작성자에게 알림 메일을 발송한다. AX Auth 메일 발송 기능을 사용하며, 연동 상세는 [mail-integration-guide.md](mail-integration-guide.md) 참고.
- 입력: 댓글 작성자의 `login_token`(그 순간 로그인 세션), 대상 문서 작성자의 이메일, 댓글 본문(메일 내용 구성용)
- 출력·동작: 발신자 = 로그인한 댓글 작성자, 수신자 = 문서 작성자 이메일로 알림 메일 발송. 댓글 생성 처리 흐름 안에서 해당 세션의 `login_token`을 이용해 즉시 발송을 트리거한다(`login_token`은 발급 후 180초 이내·1회성이므로 지연 발송 불가).
- 예외 상황: MAIL scope 미부여, 토큰 만료·중복 사용 등 실패 시 서버 로그에 기록하고 댓글 작성 자체는 정상 처리(메일 발송 실패가 댓글 등록을 막지 않음)
- 적용 범위: MS 로그인 사용자 댓글에만 적용. 외부(비로그인) 사용자 댓글은 로그인 세션이 없어 제외.
- 데이터 저장 여부: 아니오(발송 로그는 AX Auth 서버 측 `mail_send_log`에 기록됨)
- API 필요 여부: 아니오 — 신규 엔드포인트 없이 기존 `POST /api/comments` 처리 흐름 내에서 발송 트리거

#### 기능 — 이상 감지 → Slack 알림(Viewer)
- 설명: Viewer의 Confluence API 호출 실패(게시 문서 조회 실패 등), 댓글 저장 실패, 외부 사용자의 비정상적 반복 요청 등을 감지하여 Slack Webhook으로 운영팀에 전달한다.
- 입력: 서버 내부 오류·이상 이벤트
- 출력·동작: Slack 채널에 알림 메시지 전송
- 예외 상황: Slack Webhook 자체 실패 시 서버 로그에 기록
- 데이터 저장 여부: 아니오
- API 필요 여부: 아니오(서버 내부에서 Slack Webhook 직접 호출)

## 🗺️ 단계별 개발 계획

Editor와 Viewer는 별도 서비스이므로 개발 계획도 서비스별 트랙으로 나눈다. 두 트랙은 Confluence 데이터로만 연결되며, 순서상 Editor가 최소 한 번 문서를 게시해야 Viewer 쪽 실 데이터 확인이 가능하다(코드 개발 자체는 병행 가능).

### Editor 서비스 (참고 — 별도 저장소 `sfood-it-editor`에서 진행)

Editor는 Phase E1(기반 설정) → E2(핵심 기능) → E3(운영 자동화) 순서로 개발되어, 로그인(AX Auth 리다이렉트)·문서 CRUD(생성·수정·삭제)·이미지 등록·게시 설정·Slack 알림까지 실 Confluence/Slack 연동 검증을 마쳤다(2026-08-20 기준). 이 저장소로 통합 개발되던 시절의 상세 진행 기록은 참고용 이력으로 [phase-e1-e2-editor-login-crud/result.md](../tasks/phase-e1-e2-editor-login-crud/result.md), [phase-e3-editor-ops-alert/result.md](../tasks/phase-e3-editor-ops-alert/result.md)에 남아 있다. 이관 이후 Editor의 신규 개발 계획·진행 상황은 `sfood-it-editor` 저장소 자체 문서에서 관리하며, 이 문서는 더 이상 최신 상태를 추적하지 않는다.

### Tech Blog(Viewer) 서비스

**Phase V1 — 기반 설정**
- 목표: Confluence 읽기 연동·배포 파이프라인 등 Viewer 개발의 전제 조건을 갖춘다.
- 포함 기능: (Editor와 별도로) Confluence 서비스 계정 연결 확인, 배포 파이프라인 구성

**Phase V2 — 핵심 기능**
- 목표: 게시된 문서를 공개 열람하고 검색엔진에 노출할 수 있게 한다. 디자인·문서 표현 완성도를 핵심 목표로 한다.
- 포함 기능: 게시 문서 목록 조회, 게시 문서 상세 조회·렌더링, Confluence 컴포넌트 컨버터, SEO 기본 대응, sitemap.xml·robots.txt·RSS 제공, 구조화 데이터·관련 글·연관 사이트 링크
- 진행 상태(2026-09-16): "에디토리얼 매거진형" 디자인 방향을 확정([docs/guide/design-direction.md](../guide/design-direction.md))하고 홈/상세/댓글/검색 화면에 실제로 반영했다. 사내 디자인 시스템 `@sfood/ui`를 전면 도입(React 18.3.1 다운그레이드, Tailwind 도입 — [docs/guide/design-system-adoption.md](../guide/design-system-adoption.md) 참고)했다. 실 Confluence 데이터로 검증하는 과정에서 Editor가 실제로 쓰는 `publishMetadata`/제목 저장 구조가 이 문서·`data-spec.md`의 기존 설계와 달라 게시 문서가 전혀 노출되지 않던 버그를 발견해 수정했다([docs/tasks/viewer-publish-metadata-fix/](../tasks/viewer-publish-metadata-fix/) 참고) — 현재는 실제 게시 문서가 목록·상세·댓글까지 정상 노출된다. Confluence 컴포넌트 컨버터는 매크로(코드/정보 패널/표) 변환은 되어 있으나 카테고리·태그(Confluence 네이티브 페이지 레이블) 노출은 아직 미구현.

**Phase V3 — Comment 기능**
- 목표: 댓글 작성 시에만 AX 로그인을 사용해, MS 로그인 사용자와 외부 사용자 모두 댓글을 작성하고 계층 구조로 열람할 수 있게 한다.
- 포함 기능: MS 로그인 사용자 댓글 작성, 외부 사용자 댓글 작성, 대댓글 및 댓글 계층 조회(성능 최적화 포함), 댓글 알림 메일 발송
- 진행 상태: "MS 계정으로 댓글 작성" 인라인 로그인 트리거 버튼을 구현했다 — 버튼 클릭 시 현재 게시글 경로를 쿠키(`ax_return_to`)에 저장한 뒤 AX Auth 로그인으로 이동하고, 콜백(`/api/auth/ax-callback`)이 그 쿠키를 읽어 원래 보던 게시글로 되돌아온다(기존에는 콜백이 삭제된 `/editor`로 하드코딩되어 있어 저장소 분리 이후 깨져 있던 경로였음 — 함께 수정). 실 AX Auth clientId로 `login.microsoftonline.com`까지 정상 도달하는 것을 확인했다(`docs/tasks/phase-v3-comment-login-trigger/` 참고). 댓글 알림 메일의 신선한 `login_token` 확보 UX는 별도 과제로 남아 있다.

**Phase V4 — 운영 자동화**
- 목표: 운영 이상 감지 체계를 갖추고, 리다이렉트·악용 방지를 마무리하고, Viewer를 통합 검증하여 안정적으로 배포한다.
- 포함 기능: 이상 감지 → Slack 알림(Viewer), 게시 주소 변경/삭제 시 리다이렉트 처리, 외부 댓글 작성 엔드포인트 rate limiting 적용, 통합 QA

## ✅ 이관(마이그레이션) 이력 및 남은 과제

2026-08-19~20에 Editor 코드를 별도 저장소(`C:\Users\USER\projects\sfood-it-editor`)로 이관하고, 이 저장소는 Viewer(Tech Blog) 전용으로 정리했다(양쪽 모두 lint/build 통과 확인). 이관 대상 파일별 상세 체크리스트와 이관 과정에서 발견한 숨은 의존성(에러 클래스, PublishMetadata 타입 등 Viewer 쪽 독립 재정의)은 [phase-migration-editor-separation/result.md](../tasks/phase-migration-editor-separation/result.md)에 기록되어 있다. 이관 자체는 완료되었으므로 이 문서에서는 남은 과제만 추적한다.

### 남은 과제

- [ ] Editor 전용 저장소의 GitHub 원격 저장소 생성·push 및 배포 파이프라인(별도 Vercel 프로젝트/도메인) 구성
- [ ] 이 저장소(Viewer)의 배포 설정을 공개 도메인 전용으로 정리

**AX Auth clientId 분리(확정, 2026-09-11)**: 기존에 두 저장소가 임시로 공유하던 clientId는 원래 이 저장소(Viewer/Tech Blog, "blog")로 등록된 것이 맞음을 확인했다. 따라서 이 저장소는 현재 clientId를 그대로 유지하며 추가 조치가 필요 없다. Editor는 자신의 clientId를 별도로 재등록하도록 Editor 저장소 쪽에서 변경할 예정이며, 그 작업은 이 저장소의 과제가 아니다.

완료된 이관 항목(Viewer의 댓글 로그인 트리거 UX 구현 등)은 [phase-v3-comment-login-trigger/result.md](../tasks/phase-v3-comment-login-trigger/result.md) 참고. `docs/tasks/phase-1~4`는 통합 저장소 시절 기록이라 참고 자료로만 남겨둔다.

## 🗄️ 데이터 저장 여부
있음 — 두 서비스 모두 자체 DB는 두지 않으며 Confluence를 저장소로 사용한다. Editor가 쓰고, Viewer는 읽기 전용(댓글만 예외적으로 쓰기)이다. 상세 데이터 구조는 [data-spec.md](data-spec.md) 참고.

## 🔌 API 여부
필요 — 이 저장소(Viewer)는 Next.js Route Handlers 기반 자체 API(Viewer 조회·Comment)와 Confluence 읽기 전용 연동이 필요하다. Editor의 API는 Editor 저장소에서 별도로 관리한다. 이 저장소 범위의 상세 명세는 [api-spec.md](api-spec.md) 참고.
