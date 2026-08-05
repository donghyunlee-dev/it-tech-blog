# 🗄️ 데이터 설계서 — SFOOD IT Tech Blog

## 개요

architecture.md에서 정한 대로 본 서비스는 자체 데이터베이스를 두지 않고, Confluence REST API를 단일 저장소(Source of Truth)로 사용한다. 아래 엔티티는 관계형 DB 테이블이 아니라 Confluence 상에 저장되는 데이터의 구조(페이지, content properties, 댓글)를 정의한 것이다.

- 관련 문서: [requirements.md](requirements.md), [architecture.md](architecture.md), [prd.md](prd.md)

## 엔티티 목록

| 엔티티 | 설명 | prd.md 관련 기능 |
|---|---|---|
| Document | 사용자가 작성한 문서 본문(Confluence 페이지) | 문서 작성·저장, 문서 수정, 문서 목록 조회, 게시 문서 조회 |
| Publish Metadata | 게시 여부, 노출 Viewer, 공개 경로·SEO 정보(Confluence content properties) | 게시 상태 설정, 게시 문서 조회, SEO 기본 대응, sitemap/RSS 제공 |
| Comment | 댓글 및 대댓글(Confluence Comment) | MS 로그인/외부 사용자 댓글 작성, 대댓글 및 댓글 계층 조회 |

## 데이터 구조 명세

엔티티마다 Confluence API 상의 필드 구조를 기준으로 명세한다. 타입은 관계형 DB 타입이 아니라 Confluence API가 반환·저장하는 값의 형식이다.

### Document (Confluence Page)

| 필드 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| pageId | string | 필수, Confluence 발급 고유값 | 문서 식별자 |
| spaceKey | string | 필수 | 문서가 속한 Confluence Space |
| parentFolderId | string | 필수 | 작성자의 개인 폴더(Confluence 페이지) 식별자 |
| title | string | 필수 | 문서 제목 |
| body | string(storage format) | 필수 | 문서 본문(Confluence 스토리지 포맷) |
| attachments | array\<attachment\> | 선택 | 등록된 이미지 등 첨부파일 목록 |
| authorAccountId | string | 필수, 단일 서비스 계정 값 고정 | Confluence 상에 기록되는 작성 계정(실제 작성자와 다를 수 있음) |
| actualAuthorEmail | string | 필수, 애플리케이션 레벨 관리 | MS 로그인 기준 실제 작성자 이메일(별도 필드로 애플리케이션이 구분 표시) |
| version | number | 필수, Confluence 버전 관리 값 | 동시 수정 충돌 감지에 사용 |
| createdAt / updatedAt | datetime | 필수 | 생성·수정 일시 |

### Publish Metadata (Confluence Content Properties)

| 필드 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| pageId | string | 필수, Document 참조 | 대상 문서 식별자 |
| isPublished | boolean | 필수, 기본값 false | 게시 여부 |
| targetViewers | array\<string\> | 게시 시 필수 | 노출할 Viewer 목록(예: tech-blog) |
| slug | string | 게시 시 필수, 유니크 | 공개 경로(고유 URL의 일부) |
| canonicalUrl | string | 선택 | 대표 주소(canonical) |
| metaDescription | string | 게시 시 필수 | 검색·공유용 설명 |
| structuredDataType | string | 선택 | 구조화 데이터(JSON-LD)에 사용할 문서 성격 |
| redirectFrom | array\<string\> | 선택 | 주소 변경/삭제 이력 관리를 위한 과거 slug 목록 |
| publishedAt | datetime | 게시 시 필수 | 게시 일시 |

### Comment (Confluence Comment)

| 필드 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| commentId | string | 필수, Confluence 발급 고유값 | 댓글 식별자 |
| pageId | string | 필수, Document 참조 | 댓글이 속한 문서 |
| parentCommentId | string | 선택(최상위 댓글은 null) | 대댓글 관계를 나타내는 부모 댓글 식별자 |
| authorType | enum(ms_user, external) | 필수 | MS 로그인 사용자/외부 사용자 구분 |
| authorName | string | 필수 | 표시용 작성자명 |
| authorEmail | string | 필수, **민감정보** | 작성자 이메일(MS 로그인 사용자는 세션 이메일, 외부 사용자는 입력값) |
| body | string | 필수 | 댓글 본문 |
| rawStructuredBody | string | 필수 | Confluence 단일 계정에 실제로 기록되는 구조화 문자열(예: `이름 \| 이메일 \| 댓글`) |
| createdAt | datetime | 필수 | 작성 일시 |

## 관계

- Document — Publish Metadata: 1:1. 문서 하나당 게시 메타데이터 하나(게시 전에는 존재하지 않을 수 있음).
- Document — Comment: 1:N. 문서 하나에 여러 댓글이 달릴 수 있다.
- Comment — Comment: 1:N 자기 참조. `parentCommentId`를 통해 대댓글이 상위 댓글을 재귀적으로 참조하며, 계층 깊이는 고정하지 않는다.

## 인덱스·제약조건

- 별도 DB 인덱스는 없으며, 조회는 Confluence REST API 호출로 이루어진다.
- `slug`는 게시 시 Viewer 노출 대상 내에서 유니크해야 하며, Editor 게시 설정 단계에서 애플리케이션 레벨로 중복 여부를 검증한다.
- 댓글 계층은 기본적으로 `commentId`/`parentCommentId` 관계를 반복 조회하여 구성한다. 댓글 수·계층이 늘어나 조회 속도가 저하되면, 문서별 전체 댓글을 한 번에 조회한 뒤 메모리에서 계층을 구성하는 방식으로 전환하여 API 호출 횟수를 최소화한다.
- Viewer의 반복 조회 성능을 위해 Next.js ISR/엣지 캐시로 Confluence 응답을 짧은 주기로 캐싱한다(자체 DB 캐시 아님).

## 마이그레이션·데이터 정책

- 초기 시드 데이터는 필요하지 않다(서비스 시작 시점에 Confluence Space만 준비되어 있으면 된다).
- **민감정보**: 외부 사용자의 `authorEmail`, `authorName`은 개인정보에 해당한다. 애플리케이션 로그에는 평문으로 남기지 않고 마스킹 처리하며, 수집 목적(댓글 작성자 식별) 외 용도로 사용하지 않는다. 별도 DB에 보관하지 않고 Confluence에만 저장한다.
- Document의 `authorAccountId`(Confluence 단일 서비스 계정)와 `actualAuthorEmail`(실제 작성자)은 서로 다를 수 있으므로, 애플리케이션은 항상 `actualAuthorEmail` 기준으로 실제 작성자를 구분해 표시한다.
