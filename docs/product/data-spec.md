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

> **2026-09-15 정정**: 아래 Document/Publish Metadata 명세 중 `title`·`targetViewers`·평면 `slug`/`metaDescription`은 원래 의도했던 설계였으나, 실제 Editor 구현(`sfood-it-editor`의 `src/lib/editor/publish.ts`, `documents.ts`)과 실제 Confluence 데이터를 직접 대조한 결과 다르게 구현되어 있음을 확인했다. 이 문서는 **실제 구현 기준**으로 갱신했다. Viewer 쪽 반영은 [viewer-publish-metadata-fix/result.md](../tasks/viewer-publish-metadata-fix/result.md) 참고.

### Document (Confluence Page)

| 필드 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| pageId | string | 필수, Confluence 발급 고유값 | 문서 식별자 |
| spaceKey | string | 필수 | 문서가 속한 Confluence Space |
| parentFolderId | string | 필수 | 작성자의 개인 폴더(Confluence 페이지) 식별자 |
| ~~title~~ → Confluence 페이지 자체의 `title` | string | 필수, `randomUUID()` | **표시용 제목이 아니다.** Confluence는 페이지 제목이 Space 전체(다른 사용자 포함)에서 유니크해야 하는데 실제 제목("회의록" 등)은 충돌하기 쉬워, Editor가 의도적으로 무작위 UUID를 채워 충돌을 원천 차단한다(이 UUID는 `publicSlug` 생성에도 재사용됨 — 아래 Publish Metadata 참고). 화면에 보여줄 실제 제목은 아래 `sourceDocument.title`을 써야 한다. |
| body | string(storage format) | 필수 | 문서 본문(Confluence 스토리지 포맷) |
| attachments | array\<attachment\> | 선택 | 등록된 이미지 등 첨부파일 목록 |
| authorAccountId | string | 필수, 단일 서비스 계정 값 고정 | Confluence 상에 기록되는 작성 계정(실제 작성자와 다를 수 있음) |
| actualAuthorEmail | string | 필수, 애플리케이션 레벨 관리 | MS 로그인 기준 실제 작성자 이메일. Confluence content property `authorMeta`(`{ actualAuthorEmail }`)에 별도 저장됨 |
| version | number | 필수, Confluence 버전 관리 값 | 동시 수정 충돌 감지에 사용 |
| createdAt / updatedAt | datetime | 필수 | 생성·수정 일시 |

#### Source Document (Confluence Content Property `sourceDocument`)

Editor 내부 편집기(Tiptap/ProseMirror)의 원본과 **문서의 실제 표시용 제목**을 담는 별도 content property. Editor `documents.ts`의 `createDocument()`가 `upsertPageProperty(pageId, "sourceDocument", { title, doc })`로 쓴다.

| 필드 | 타입 | 설명 |
|---|---|---|
| title | string | 문서의 실제 표시용 제목. Viewer는 반드시 이 값을 쓴다(Confluence 페이지의 `title`은 UUID라 쓸 수 없음). |
| doc | JSONContent | Tiptap/ProseMirror 편집기 원본 트리(Viewer는 사용하지 않음 — Viewer는 `body`(storage format)만 읽는다). |

### Publish Metadata (Confluence Content Property `publishMetadata`)

| 필드 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| pageId | string | 필수, Document 참조 | 대상 문서 식별자 |
| isPublished | boolean | 필수, 기본값 false | 게시 여부 |
| publishedAt | datetime | 게시 시 필수 | 게시 일시 |
| viewers | `Record<viewerId, PublishViewerMetadata>` | 게시 시 필수 | ~~`targetViewers: string[]`~~에서 변경됨 — 노출 대상 Viewer id(예: `"tech-blog"`)를 키로 하는 객체. 아래 `PublishViewerMetadata` 참고. |

**PublishViewerMetadata** (위 `viewers` 객체의 값, viewer별로 하나씩):

| 필드 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| slug | string | 게시 시 필수 | 작성자가 입력한 원본 slug. **전역 유니크가 보장되지 않으므로 공개 경로에 직접 쓰면 안 된다.** |
| metaDescription | string | 게시 시 필수 | 검색·공유용 설명 |
| publicSlug | string | 서버 생성, 유니크 | `${slug}-${Confluence 페이지 title(UUID)}` 형태로 Editor가 서버에서 계산하는 전역 유니크 값. **Viewer의 공개 경로(`/posts/{publicSlug}`)는 이 값을 써야 한다.** URL에서 페이지를 역으로 찾을 때는 마지막 `-` 뒤 36자 UUID로 조회한다. |

> `canonicalUrl`/`structuredDataType`/`redirectFrom`은 Editor 어디에도 실제로 쓰는 코드가 없어 목록에서 제거했다(과거 설계 문서에만 존재했음). 필요해지면 그때 다시 설계·추가한다.
>
> **태그/카테고리**는 이 content property가 아니라 **Confluence 네이티브 페이지 레이블**로 구현되어 있다(`label(태그): string[]`, Editor 쪽 확인됨). Viewer는 `GET /api/v2/pages/{id}/labels`(`prefix: "global"`인 것만)로 조회해 홈/상세 화면의 태그 라인(design-direction.md 키커)에 노출한다(2026-09-16, [viewer-tag-labels](../tasks/viewer-tag-labels/) 참고) — 사전 정의된 카테고리 체계가 아니라 작성자가 자유롭게 붙인 다중 태그이므로, 화면에는 순서상 앞의 최대 3개만 `·`로 이어 보여준다.

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
- `publicSlug`(공개 경로에 실제로 쓰이는 값)는 Editor가 `${slug}-${페이지 UUID}` 형태로 서버에서 생성해 항상 전역 유니크함을 보장한다(애플리케이션 레벨의 별도 중복 검증 로직은 없음 — UUID 접미사로 충돌 자체가 구조적으로 불가능하게 만드는 방식).
- 댓글 계층은 기본적으로 `commentId`/`parentCommentId` 관계를 반복 조회하여 구성한다. 댓글 수·계층이 늘어나 조회 속도가 저하되면, 문서별 전체 댓글을 한 번에 조회한 뒤 메모리에서 계층을 구성하는 방식으로 전환하여 API 호출 횟수를 최소화한다.
- Viewer의 반복 조회 성능을 위해 Next.js ISR/엣지 캐시로 Confluence 응답을 짧은 주기로 캐싱한다(자체 DB 캐시 아님).

## 마이그레이션·데이터 정책

- 초기 시드 데이터는 필요하지 않다(서비스 시작 시점에 Confluence Space만 준비되어 있으면 된다).
- **민감정보**: 외부 사용자의 `authorEmail`, `authorName`은 개인정보에 해당한다. 애플리케이션 로그에는 평문으로 남기지 않고 마스킹 처리하며, 수집 목적(댓글 작성자 식별) 외 용도로 사용하지 않는다. 별도 DB에 보관하지 않고 Confluence에만 저장한다.
- Document의 `authorAccountId`(Confluence 단일 서비스 계정)와 `actualAuthorEmail`(실제 작성자)은 서로 다를 수 있으므로, 애플리케이션은 항상 `actualAuthorEmail` 기준으로 실제 작성자를 구분해 표시한다.
