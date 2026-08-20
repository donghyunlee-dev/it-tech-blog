# 📄 PRD — SFOOD IT Tech Blog

> 구조 변경(2026-08-19): Editor와 Viewer(Tech Blog)를 **별도로 개발·배포되는 두 개의 서비스**로 재구성했다. 이전 버전은 일정 사유로 하나의 저장소에 통합해 진행했으나, requirements.md의 원 요구사항(Editor/Viewer 분리)에 맞춰 되돌렸다. 이 저장소는 이후 **Viewer(Tech Blog) 전용**으로 정리하고, Editor는 별도 저장소/애플리케이션으로 이관한다. 기존에 구현된 코드는 대부분 로직 재사용이 가능하며, 아래 "이관(마이그레이션) 체크리스트"에 서비스별로 정리했다.
>
> 이관 완료(2026-08-20): Editor 코드를 로컬 형제 디렉토리 `C:\Users\USER\projects\sfood-it-editor`로 분리하고(초기 커밋 완료, GitHub 원격 저장소 생성/push는 미진행), 이 저장소는 Editor 코드를 제거해 Viewer 전용으로 정리했다. 양쪽 모두 lint/build 통과 확인. 상세는 [phase-migration-editor-separation/result.md](../tasks/phase-migration-editor-separation/result.md) 참고. 남은 항목은 아래 체크리스트에 그대로 표시.

## 🎯 서비스 정의

사내 직원이 로그인 후 문서를 작성·관리하는 사내 전용 도구 **Editor**와, 게시된 문서를 누구나 열람할 수 있는 공개 **Tech Blog(Viewer)**를 별도의 두 서비스로 구성한다.

- **Editor**: 사내 IT 담당자·AX팀 전용 애플리케이션. 앱의 메인 진입점이 로그인 화면이며, 로그인하지 않으면 어떤 화면도 사용할 수 없다. Confluence를 직접 컨트롤(문서 생성·수정·이미지 등록·게시 상태 설정)하는 콘텐츠 관리 도구다.
- **Tech Blog(Viewer)**: 누구나 비로그인으로 열람 가능한 공개 블로그. **디자인과 문서 표현(가독성, SEO, 렌더링 품질)이 핵심**이며, 문서를 작성하는 기능은 없다. **Comment 기능을 포함**하되, 댓글을 작성하려는 시점에만 AX Auth 로그인을 일시적으로 사용해 Confluence에 댓글을 저장한다. 그 외 열람은 모두 비로그인으로 동작한다.

두 서비스는 별도로 개발·배포되며, **Confluence를 유일한 공유 저장소**로 사용해 Editor가 작성·게시한 문서를 Tech Blog가 읽어 노출한다. 서로 API를 직접 호출하지 않는다.

- 관련 문서: [requirements.md](requirements.md), [architecture.md](architecture.md), [login-integration-guide.md](login-integration-guide.md), [mail-integration-guide.md](mail-integration-guide.md)

## 🖥️ 화면 정의

### Editor 서비스 화면

| 화면 | 목적 | 주요 구성 요소 | 진입 경로 |
|---|---|---|---|
| 로그인 화면(메인 진입점) | AX Auth 로그인, 미로그인 시 앱 전체 접근 차단 | MS 로그인 버튼, 로그인 상태 안내 | Editor 서비스 접속 시 항상 최초 진입(로그인 없이는 다른 화면 접근 불가) |
| 탐색기(대시보드) | 로그인한 사용자의 개인 폴더와 문서 구조 확인 | 폴더/페이지 트리, 새 문서 작성 버튼, 최근 문서 목록 | 로그인 성공 후 첫 진입 |
| 문서 편집 화면 | 문서 작성·수정, 이미지 등록 | Markdown/블록 에디터, 이미지 업로드, 저장 버튼 | 탐색기에서 문서 선택 또는 새 문서 생성 |
| 게시 설정 화면 | 게시 여부, 노출 Viewer, 공개 경로·SEO 정보 설정 | 게시 토글, Viewer 선택, slug 입력, meta description 입력 | 문서 편집 화면에서 게시 진입 |

### Tech Blog(Viewer) 서비스 화면

| 화면 | 목적 | 주요 구성 요소 | 진입 경로 |
|---|---|---|---|
| Tech Blog 홈 | 게시된 문서 목록과 연관 사이트 링크 노출 | 게시글 목록/카드, 정렬, 연관 사이트 링크 | 공개 URL 루트 접속(비로그인) |
| 문서 상세 화면 | 게시된 문서 본문과 댓글 노출 | 본문 렌더링(컴포넌트 컨버터 적용), 관련 글, Comment 위젯 | 문서 목록에서 클릭 또는 고유 URL 직접 접근(비로그인) |
| Comment 위젯(문서 상세 하단) | 댓글 계층 열람·작성 | 댓글 계층 목록, 답글 버튼, 작성 폼, "MS 계정으로 댓글 작성" 버튼(로그인 트리거) | 문서 상세 화면 하단 |

> Tech Blog에는 별도의 "로그인 화면"이 존재하지 않는다. AX Auth 로그인은 댓글 작성 버튼을 눌렀을 때만 인라인으로 트리거되고, 완료되면 다시 문서 상세 화면으로 돌아온다.

## 🛠️ 개발 스펙 정의

기술 스택과 근거는 [architecture.md](architecture.md)에 상세히 기술되어 있다. 개발 착수 전 참고할 핵심 내용은 서비스별로 다음과 같다.

### Editor 서비스

- **프론트엔드/백엔드**: Next.js(React, TypeScript) — Viewer와 별도의 저장소/애플리케이션.
- **데이터 저장**: 자체 DB 없음. Confluence REST API v2에 문서·게시 메타데이터를 직접 쓴다. 상세 데이터 구조는 [data-spec.md](data-spec.md) 참고.
- **인증**: 앱 전체가 로그인 필수. Azure AD와 직접 OIDC 연동은 하지 않고, AX Auth가 대행한 로그인 결과(`login_token`)를 백엔드가 리다이렉트 방식으로 검증해 Auth.js(NextAuth) 세션을 생성한다. 연동 상세는 [login-integration-guide.md](login-integration-guide.md) 참고.
- **Confluence 연동**: Confluence Cloud REST API v2(+첨부파일은 v1), 프로젝트 담당자의 단일 서비스 계정 API 토큰 사용. 토큰은 서버 환경변수/시크릿 매니저에만 보관.
- **배포/CI-CD**: Editor 전용 프로젝트/도메인으로 독립 배포. Vercel + GitHub Actions, main 브랜치 push 시 자동 배포.
- **운영 알림**: Editor 자신의 Confluence 연동 실패 등 이상 감지 시 Slack Incoming Webhook으로 운영팀에 알림.

### Tech Blog(Viewer) 서비스

- **프론트엔드/백엔드**: Next.js(React, TypeScript) — Editor와 별도의 저장소/애플리케이션. SEO를 위한 서버 렌더링(SSR/ISR)에 집중.
- **데이터 저장**: 자체 DB 없음. Confluence REST API v2를 **읽기 전용**으로 조회(댓글만 예외적으로 쓰기). 반복 조회 성능을 위해 Next.js ISR/엣지 캐시를 활용한다. 상세 데이터 구조는 [data-spec.md](data-spec.md) 참고.
- **인증**: 열람 자체는 비로그인. **댓글 작성 시에만** AX Auth 로그인을 트리거해 Auth.js(NextAuth) 세션을 일시적으로 생성한다. 연동 상세는 [login-integration-guide.md](login-integration-guide.md) 참고.
- **댓글 알림 메일**: 댓글 작성 시 문서 작성자에게 보내는 알림 메일 발송에 AX Auth 메일 발송 기능을 사용한다. 발신자는 로그인한 댓글 작성자, 수신자는 문서 작성자 이메일이며, MS 로그인 사용자 댓글에만 적용된다. 연동 방식·제약 사항은 [mail-integration-guide.md](mail-integration-guide.md) 참고.
- **Confluence 연동**: Confluence Cloud REST API v2, Editor와 동일한 단일 서비스 계정 API 토큰 사용(읽기 위주 + 댓글 쓰기).
- **배포/CI-CD**: 검색엔진 노출이 필요한 공개 도메인으로 독립 배포. Vercel + GitHub Actions.
- **운영 알림**: Viewer 자신의 Confluence 연동 실패(게시 문서 조회 실패, 댓글 저장 실패 등) 감지 시 Slack Incoming Webhook으로 운영팀에 알림.

공통: 두 서비스 모두 별도 스테이징 환경 없이 PR Preview 배포로 검증한다. API 상세 명세는 [api-spec.md](api-spec.md) 참고(서비스 분리에 맞춘 재정리 필요 — 아래 "다음 정리 필요 문서" 참고).

## 🧩 기능별 정의

### Editor 서비스 기능

#### 기능 — MS SSO 로그인(Editor 메인 진입점)
- 설명: 앱 접속 시 항상 로그인 화면부터 시작하며, AX Auth 경유 사내 SSO로 인증한다. 로그인 전에는 다른 화면에 접근할 수 없다.
- 입력: 사내 MS 계정 자격 증명(AX Auth 로그인 플로우)
- 출력·동작: 로그인 성공 시 세션 생성, 사용자 메일/이름을 실제 작성자 정보로 사용, 탐색기로 이동
- 예외 상황: 인증 실패 시 로그인 화면으로 재이동 및 오류 안내
- 데이터 저장 여부: 아니오
- API 필요 여부: 예 — AX Auth 리다이렉트 콜백 라우트, Auth.js 표준 라우트. 기술 스펙은 [login-integration-guide.md](login-integration-guide.md) 참고

#### 기능 — 개인 폴더 확인/생성
- 설명: 로그인한 사용자의 메일 계정을 기준으로 Confluence Space 내 개인 폴더를 확인하고, 없으면 생성한다.
- 입력: 로그인 사용자의 메일 계정
- 출력·동작: 기존 폴더 연결 또는 신규 폴더 생성 후 탐색기 화면 진입
- 예외 상황: Confluence API 호출 실패 시 오류 안내 및 이상 감지 알림 트리거
- 데이터 저장 여부: 예 — data-spec.md의 Document(개인 폴더/Space 구조)
- API 필요 여부: 예 — GET/POST `/api/editor/folder`

#### 기능 — 문서 목록 조회(탐색기)
- 설명: 개인 폴더 하위 문서를 폴더/페이지 구조로 조회한다.
- 입력: 로그인 사용자의 개인 폴더 식별자
- 출력·동작: 폴더/페이지 트리 형태로 문서 목록 표시
- 예외 상황: 문서가 없을 경우 빈 상태 안내
- 데이터 저장 여부: 예 — data-spec.md의 Document
- API 필요 여부: 예 — GET `/api/editor/documents`

#### 기능 — 문서 작성·저장
- 설명: Markdown, 블록 단위 편집, 이미지 등록 등을 지원하는 편집기로 신규 문서를 작성하고 Confluence 문서로 변환하여 저장한다.
- 입력: 문서 제목, 본문(Markdown/블록), 첨부 이미지
- 출력·동작: Confluence 페이지 생성, 탐색기에 반영
- 예외 상황: 저장 실패 시 편집 내용 유지 및 재시도 안내
- 데이터 저장 여부: 예 — data-spec.md의 Document
- API 필요 여부: 예 — POST `/api/editor/documents`

#### 기능 — 문서 수정
- 설명: 기존 문서의 본문·제목을 수정한다.
- 입력: 문서 식별자(Confluence pageId), 변경된 본문/제목
- 출력·동작: Confluence 페이지 갱신
- 예외 상황: 동시 수정 충돌(Confluence 버전 충돌) 시 최신 버전 안내 후 재시도 요청
- 데이터 저장 여부: 예 — data-spec.md의 Document
- API 필요 여부: 예 — PUT `/api/editor/documents/{pageId}`

#### 기능 — 이미지 등록
- 설명: 문서 작성·수정 중 이미지를 업로드하여 본문에 삽입한다.
- 입력: 이미지 파일
- 출력·동작: Confluence 첨부파일로 업로드 후 본문에 삽입 가능한 참조 반환
- 예외 상황: 업로드 실패 또는 허용되지 않는 파일 형식 시 오류 안내
- 데이터 저장 여부: 예 — data-spec.md의 Document(첨부파일)
- API 필요 여부: 예 — POST `/api/editor/documents/{pageId}/images`

#### 기능 — 게시 상태·노출 Viewer·SEO 정보 설정
- 설명: 문서의 게시 여부, 노출할 Viewer, 공개 경로(slug), 검색·공유용 메타 정보를 설정하여 Confluence content properties에 저장한다.
- 입력: 게시 여부, 대상 Viewer, 공개 경로, meta description 등 SEO 정보
- 출력·동작: content properties 갱신, 게시 시 Viewer에서 즉시 조회 가능
- 예외 상황: 필수 SEO 정보 누락 시 게시 차단 및 안내
- 데이터 저장 여부: 예 — data-spec.md의 Publish Metadata(Content Properties)
- API 필요 여부: 예 — PATCH `/api/editor/documents/{pageId}/publish`

#### 기능 — 이상 감지 → Slack 알림(Editor)
- 설명: Editor의 Confluence API 호출 실패(게시 실패, 인증 만료, rate limit 초과)를 감지하여 Slack Webhook으로 운영팀에 전달한다.
- 입력: 서버 내부 오류·이상 이벤트
- 출력·동작: Slack 채널에 알림 메시지 전송
- 예외 상황: Slack Webhook 자체 실패 시 서버 로그에 기록
- 데이터 저장 여부: 아니오
- API 필요 여부: 아니오(서버 내부에서 Slack Webhook 직접 호출)

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

### Editor 서비스

**Phase E1 — 기반 설정**
- 목표: 로그인·Confluence 연동·배포 파이프라인 등 Editor 개발의 전제 조건을 갖춘다.
- 포함 기능: MS SSO 로그인(Editor 메인 진입점)
- 진행 순서(AX Auth 등록 선후관계): AX Auth에 `redirect_uri`를 등록하려면 실제로 접속 가능한 콜백 URL이 먼저 있어야 한다. 따라서 ① 로그인 코드(콜백 라우트 포함)를 자격증명 없이 먼저 구현 → ② Editor를 배포해 실제 콜백 URL(예: `https://{Editor 도메인}/api/auth/ax-callback`)을 확보 → ③ 그 URL로 AX팀에 `clientId`/`redirect_uri` 등록 요청 → ④ 발급받은 값을 `.env`에 채우고 실 로그인 검증, 순서로 진행한다. Phase E2(핵심 기능) 개발은 ③·④를 기다리지 않고 ①·② 완료 후 병행 가능하다(Confluence 연동은 AX Auth와 무관하게 별도로 검증).
- 진행 상태: 로그인 코드(리다이렉트 방식: MS 로그인 버튼 클릭 → AX Auth 서비스 호출 → 콜백 경로 이동, 팝업 아님) 구현 완료. `.env`에 채워진 실 clientId로 로그인 페이지의 링크를 클릭하면 실제 `login.microsoftonline.com` 화면까지 도달함을 확인해 clientId 등록이 유효함을 재검증했다(`docs/tasks/phase-e1-e2-editor-login-crud/` 참고). 실 계정으로 로그인을 끝까지 완료하는 것은 사용자가 직접 진행해야 한다(AI는 실 자격증명을 대신 입력하지 않음).

**Phase E2 — 핵심 기능**
- 목표: 사내 직원이 문서를 작성·수정·삭제·게시 설정할 수 있게 한다.
- 포함 기능: 개인 폴더 확인/생성, 문서 목록 조회(탐색기), 문서 작성·저장, 문서 수정, 문서 삭제, 이미지 등록, 게시 상태·노출 Viewer·SEO 정보 설정
- 진행 상태: 문서 생성·수정·삭제·이미지 등록·게시 설정 코드 구현 완료. 삭제는 Confluence 휴지통 이동(soft delete) 방식이며, 실 Confluence 인스턴스에 대한 생성→수정→버전충돌감지→삭제→목록제외 전체 흐름 검증 완료(`docs/tasks/phase-e1-e2-editor-login-crud/` 참고). 실 로그인 세션을 통한 Editor UI 브라우저 클릭 테스트는 사용자 확인 결과 별도로 진행하지 않기로 함(백엔드/Confluence 연동 검증으로 충분하다고 판단).

**Phase E3 — 운영 자동화**
- 목표: 운영 이상 감지 체계를 갖추고 Editor를 통합 검증하여 안정적으로 배포한다.
- 포함 기능: 이상 감지 → Slack 알림(Editor), 통합 QA
- 진행 상태: Slack 알림 배선 완료 — `sendSlackAlert`를 공통 오류 응답 계층(`toErrorResponse`)의 502(Confluence 연동 실패) 분기에 연결했고, 실 Slack Webhook에 테스트 메시지를 1회 전송해 정상 도달을 확인했다. 통합 QA도 완료 — 이미지 등록(첨부파일 업로드 + `<ac:image>` 매크로 변환)과 게시 설정(slug 충돌 감지 포함)까지 실 Confluence 인스턴스로 검증해, Editor 핵심 기능 전체(로그인·CRUD·이미지·게시·Slack 알림)의 실 연동 검증을 마쳤다(`docs/tasks/phase-e3-editor-ops-alert/` 참고). 이 배선은 현재 저장소 구조상 Viewer/Comment API에도 함께 적용된다.

### Tech Blog(Viewer) 서비스

**Phase V1 — 기반 설정**
- 목표: Confluence 읽기 연동·배포 파이프라인 등 Viewer 개발의 전제 조건을 갖춘다.
- 포함 기능: (Editor와 별도로) Confluence 서비스 계정 연결 확인, 배포 파이프라인 구성

**Phase V2 — 핵심 기능**
- 목표: 게시된 문서를 공개 열람하고 검색엔진에 노출할 수 있게 한다. 디자인·문서 표현 완성도를 핵심 목표로 한다.
- 포함 기능: 게시 문서 목록 조회, 게시 문서 상세 조회·렌더링, Confluence 컴포넌트 컨버터, SEO 기본 대응, sitemap.xml·robots.txt·RSS 제공, 구조화 데이터·관련 글·연관 사이트 링크

**Phase V3 — Comment 기능**
- 목표: 댓글 작성 시에만 AX 로그인을 사용해, MS 로그인 사용자와 외부 사용자 모두 댓글을 작성하고 계층 구조로 열람할 수 있게 한다.
- 포함 기능: MS 로그인 사용자 댓글 작성, 외부 사용자 댓글 작성, 대댓글 및 댓글 계층 조회(성능 최적화 포함), 댓글 알림 메일 발송

**Phase V4 — 운영 자동화**
- 목표: 운영 이상 감지 체계를 갖추고, 리다이렉트·악용 방지를 마무리하고, Viewer를 통합 검증하여 안정적으로 배포한다.
- 포함 기능: 이상 감지 → Slack 알림(Viewer), 게시 주소 변경/삭제 시 리다이렉트 처리, 외부 댓글 작성 엔드포인트 rate limiting 적용, 통합 QA

## ✅ 이관(마이그레이션) 체크리스트

기존에 하나의 저장소에서 구현된 코드는 로직 대부분을 그대로 재사용할 수 있다. 아래는 "새로 만들어야 하는 것"이 아니라 "어느 서비스로 이관해야 하는지"를 정리한 목록이다. 이관 이후에는 위 Phase 체크리스트(E1~E3, V1~V4)를 새 기준으로 갱신한다.

### Editor 서비스로 이관

- [x] `src/lib/auth.ts`, `src/lib/ax-auth/client.ts`, `src/app/api/auth/ax-callback/route.ts`, `src/app/login/page.tsx` — Editor 전용 저장소로 이관 완료
- [x] `src/lib/editor/*`(folder, documents, images, publish, markdown, errors), `src/lib/auth-guard.ts` — Editor 전용 저장소로 이관 완료
- [x] `src/app/editor/*`, `src/components/editor/*` — Editor 전용 저장소로 이관 완료
- [x] `src/app/api/editor/*` — Editor 전용 저장소로 이관 완료
- [x] `src/lib/confluence/client.ts` — Editor 전용 저장소에 복사 완료(전체 함수 포함 — Editor는 읽기·쓰기 모두 필요)
- [x] `src/lib/notifications/slack.ts` — Editor 전용 저장소로 이관 완료
- [x] `.env.example`의 `AX_AUTH_*`, `CONFLUENCE_*`, `AUTH_SECRET`, `SLACK_WEBHOOK_URL` — Editor 전용 환경변수로 이관 완료(실 값도 필터링 복사해 로컬에서 lint/build/로그인 렌더링 검증까지 완료)
- [x] `src/lib/api-response.ts` — Editor 전용 저장소로 이관 완료(Slack 알림 배선 포함)
- [x] 새 저장소 위치: `C:\Users\USER\projects\sfood-it-editor`(로컬 git 저장소, 초기 커밋 완료). GitHub 원격 저장소 생성/push는 미진행(사용자가 별도 진행)

### Viewer(Tech Blog) 서비스로 남김 — 이 저장소

- [x] `src/app/page.tsx`, `src/app/posts/[slug]/page.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/rss.xml/route.ts` — 그대로 유지(robots.ts는 더 이상 없는 `/editor`·`/login` 경로를 disallow 목록에서 제거)
- [x] `src/lib/viewer/*`(posts, converter, related-sites) — 그대로 유지
- [x] `src/app/api/viewer/*` — 그대로 유지
- [x] `src/lib/comments/*`, `src/components/comments/CommentSection.tsx`, `src/app/api/comments/route.ts` — 그대로 유지(Comment는 Viewer 소속)
- [x] `src/lib/confluence/client.ts` — 읽기 위주 함수(getPage/getPageProperty/listAllSpacePages/listFooterComments/createFooterComment/getCurrentConfluenceUser 등)만 남기고 쓰기 전용 함수 제거 완료
- [x] `src/lib/auth.ts`, `src/lib/ax-auth/client.ts`, `src/app/api/auth/ax-callback/route.ts` — **댓글 작성용으로만** 유지(로그인 화면·전역 세션 게이트 없음, `src/app/login/page.tsx`는 삭제함)
- [x] `src/lib/site.ts` — 그대로 유지
- [x] `src/lib/api-response.ts`, `src/lib/notifications/slack.ts` — 그대로 유지
- [x] `.env.example`의 `CONFLUENCE_*`, `SITE_BASE_URL`, 댓글 로그인용 `AX_AUTH_*`, `AUTH_SECRET`, `SLACK_WEBHOOK_URL` — 그대로 유지
- [x] (신규) `src/lib/errors.ts`, `src/lib/viewer/publish-metadata.ts` — Editor 코드 삭제 과정에서 드러난 숨은 의존성(에러 클래스, PublishMetadata 타입)을 Viewer 쪽에 독립적으로 재정의(상세는 [phase-migration-editor-separation/result.md](../tasks/phase-migration-editor-separation/result.md) 참고)

### 이관 후 신규로 처리해야 할 것

- [ ] Editor 전용 저장소의 GitHub 원격 저장소 생성·push 및 배포 파이프라인(별도 Vercel 프로젝트/도메인) 구성
- [ ] 이 저장소(Viewer)의 배포 설정을 공개 도메인 전용으로 정리
- [x] Tech Blog 홈/문서 상세에 있던 "Editor로 이동" 관련 내비게이션 — 원래 없었으므로 해당 없음
- [ ] AX Auth에 Editor용 `clientId`와 Viewer(댓글용)용 `clientId`를 각각 별도로 등록 요청(현재는 기존 하나의 clientId를 두 저장소의 `.env`에 임시로 그대로 복사해 둔 상태 — 서비스별로 나눠야 함)
- [x] `docs/tasks/`의 기존 phase-1~4 작업 문서는 통합 저장소 기준으로 작성된 것이므로 참고 자료로만 남겨둠(phase-e1-e2, phase-e3, phase-migration 문서가 실제 서비스 분리 기준 최신 기록)
- [ ] Viewer의 "MS 계정으로 댓글 작성" 인라인 로그인 트리거 UX 구현(현재 미구현 — Comment 기능의 실질적 완성에 필요, 기존에 열려 있던 별도 과제)

## 🗄️ 데이터 저장 여부
있음 — 두 서비스 모두 자체 DB는 두지 않으며 Confluence를 저장소로 사용한다. Editor가 쓰고, Viewer는 읽기 전용(댓글만 예외적으로 쓰기)이다. 상세 데이터 구조는 [data-spec.md](data-spec.md) 참고.

## 🔌 API 여부
필요 — 두 서비스 모두 각자의 Next.js Route Handlers 기반 자체 API와 Confluence API 연동이 필요하다. 상세 명세는 [api-spec.md](api-spec.md) 참고(서비스 분리에 맞춰 Editor API 명세와 Viewer API 명세로 나누는 재정리가 아직 필요 — 다음 작업으로 남김).
