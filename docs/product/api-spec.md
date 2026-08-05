# 🔌 API 명세서 — SFOOD IT Tech Blog

## 개요

본 문서는 Editor·Viewer·Comment가 사용하는 Next.js Route Handlers(자체 API) 명세를 다룬다. 이 API들은 내부적으로 Confluence Cloud REST API v2(서비스 계정 토큰 사용)를 호출하여 실제 데이터를 저장·조회한다.

- **Base URL**: 서비스 배포 도메인(Vercel) 기준 `/api/...` (동일 오리진, 별도 API 서버 없음)
- **인증 방식**: Microsoft Entra ID(Azure AD) OIDC 기반 Auth.js(NextAuth) 세션 쿠키. Editor 관련 API는 유효한 세션이 필수이며, Viewer 관련 API는 인증이 필요 없다. 외부 사용자 댓글 작성 API는 세션 대신 요청 본문의 이름·이메일로 작성자를 식별한다.
- **공통 응답 형식**: JSON. 성공 시 요청한 리소스 또는 처리 결과를 반환하고, 실패 시 아래 공통 에러 형식을 사용한다.
- **공통 에러 형식**:
  ```json
  {
    "error": {
      "code": "오류 코드 문자열",
      "message": "사용자에게 노출 가능한 오류 설명"
    }
  }
  ```
- 로그인(Microsoft Entra ID OIDC) 자체는 Auth.js 표준 라우트(`/api/auth/[...nextauth]`)를 그대로 사용하며, 별도 커스텀 엔드포인트를 설계하지 않는다.
- Slack 이상 감지 알림은 사용자에게 노출되는 엔드포인트가 아니라, 아래 API들의 서버 내부 오류 처리 로직에서 Slack Incoming Webhook을 직접 호출하는 방식으로 동작한다.

## 엔드포인트 목록

| Method | 경로 | 설명 | prd.md 관련 기능 |
|---|---|---|---|
| GET | /api/editor/folder | 개인 폴더 확인 | 개인 폴더 확인/생성 |
| POST | /api/editor/folder | 개인 폴더 생성 | 개인 폴더 확인/생성 |
| GET | /api/editor/documents | 문서 목록 조회 | 문서 목록 조회(탐색기) |
| POST | /api/editor/documents | 문서 신규 작성·저장 | 문서 작성·저장 |
| PUT | /api/editor/documents/{pageId} | 문서 수정 | 문서 수정 |
| POST | /api/editor/documents/{pageId}/images | 이미지 등록 | 이미지 등록 |
| PATCH | /api/editor/documents/{pageId}/publish | 게시 상태·노출 Viewer·SEO 설정 | 게시 상태·노출 Viewer·SEO 정보 설정 |
| GET | /api/viewer/posts | 게시 문서 목록 조회 | 게시 문서 목록 조회(Viewer) |
| GET | /api/viewer/posts/{slug} | 게시 문서 상세 조회 | 게시 문서 상세 조회·렌더링 |
| GET | /sitemap.xml | sitemap 생성 | sitemap.xml·robots.txt·RSS 제공 |
| GET | /robots.txt | robots 정책 제공 | sitemap.xml·robots.txt·RSS 제공 |
| GET | /rss.xml | RSS 피드 생성 | sitemap.xml·robots.txt·RSS 제공 |
| GET | /api/comments | 댓글 목록(계층 포함) 조회 | 대댓글 및 댓글 계층 조회 |
| POST | /api/comments | 댓글·대댓글 작성 | MS 로그인/외부 사용자 댓글 작성 |

## 엔드포인트 상세

### GET /api/editor/folder — 개인 폴더 확인

**Header**
| 이름 | 필수 여부 | 설명 |
|---|---|---|
| Cookie(세션) | 필수 | Auth.js 세션 쿠키 |

**Request Body**
해당 없음

**Response Body (성공)**
```json
{
  "exists": true,
  "folderId": "Confluence 개인 폴더 페이지 ID",
  "spaceKey": "Confluence Space Key"
}
```

**Response (실패)**
| 상태 코드 | 사유 | 설명 |
|---|---|---|
| 401 | 인증 실패 | 세션 없음/만료 |
| 502 | 연동 실패 | Confluence API 호출 실패 |

### POST /api/editor/folder — 개인 폴더 생성

**Header**
| 이름 | 필수 여부 | 설명 |
|---|---|---|
| Cookie(세션) | 필수 | Auth.js 세션 쿠키 |

**Request Body**
해당 없음(세션의 이메일 기준으로 생성)

**Response Body (성공)**
```json
{
  "folderId": "생성된 Confluence 페이지 ID",
  "spaceKey": "Confluence Space Key"
}
```

**Response (실패)**
| 상태 코드 | 사유 | 설명 |
|---|---|---|
| 401 | 인증 실패 | 세션 없음/만료 |
| 409 | 이미 존재 | 개인 폴더가 이미 존재함 |
| 502 | 연동 실패 | Confluence API 호출 실패 |

### GET /api/editor/documents — 문서 목록 조회

**Header**
| 이름 | 필수 여부 | 설명 |
|---|---|---|
| Cookie(세션) | 필수 | Auth.js 세션 쿠키 |

**Request Body**
해당 없음

**Response Body (성공)**
```json
{
  "documents": [
    { "pageId": "문서 ID", "title": "문서 제목", "updatedAt": "수정 일시" }
  ]
}
```

**Response (실패)**
| 상태 코드 | 사유 | 설명 |
|---|---|---|
| 401 | 인증 실패 | 세션 없음/만료 |
| 502 | 연동 실패 | Confluence API 호출 실패 |

### POST /api/editor/documents — 문서 신규 작성·저장

**Header**
| 이름 | 필수 여부 | 설명 |
|---|---|---|
| Cookie(세션) | 필수 | Auth.js 세션 쿠키 |

**Request Body**
```json
{
  "title": "문서 제목",
  "body": "Markdown/블록 편집 결과(Confluence 스토리지 포맷으로 변환된 값)"
}
```

**Response Body (성공)**
```json
{
  "pageId": "생성된 Confluence 페이지 ID",
  "version": 1
}
```

**Response (실패)**
| 상태 코드 | 사유 | 설명 |
|---|---|---|
| 400 | 잘못된 요청 | 제목 또는 본문 누락 |
| 401 | 인증 실패 | 세션 없음/만료 |
| 502 | 연동 실패 | Confluence API 호출 실패 |

### PUT /api/editor/documents/{pageId} — 문서 수정

**Header**
| 이름 | 필수 여부 | 설명 |
|---|---|---|
| Cookie(세션) | 필수 | Auth.js 세션 쿠키 |

**Request Body**
```json
{
  "title": "수정된 제목",
  "body": "수정된 본문",
  "version": 1
}
```

**Response Body (성공)**
```json
{
  "pageId": "문서 ID",
  "version": 2
}
```

**Response (실패)**
| 상태 코드 | 사유 | 설명 |
|---|---|---|
| 400 | 잘못된 요청 | 필수값 누락 |
| 401 | 인증 실패 | 세션 없음/만료 |
| 404 | 문서 없음 | 존재하지 않는 pageId |
| 409 | 버전 충돌 | 요청한 version이 최신이 아님(동시 수정) |
| 502 | 연동 실패 | Confluence API 호출 실패 |

### POST /api/editor/documents/{pageId}/images — 이미지 등록

**Header**
| 이름 | 필수 여부 | 설명 |
|---|---|---|
| Cookie(세션) | 필수 | Auth.js 세션 쿠키 |
| Content-Type | 필수 | multipart/form-data |

**Request Body**
```json
{
  "file": "업로드할 이미지 파일(multipart)"
}
```

**Response Body (성공)**
```json
{
  "attachmentId": "Confluence 첨부파일 ID",
  "url": "본문 삽입에 사용할 참조 URL"
}
```

**Response (실패)**
| 상태 코드 | 사유 | 설명 |
|---|---|---|
| 400 | 잘못된 요청 | 파일 누락 또는 허용되지 않는 형식 |
| 401 | 인증 실패 | 세션 없음/만료 |
| 502 | 연동 실패 | Confluence API 호출 실패 |

### PATCH /api/editor/documents/{pageId}/publish — 게시 상태·노출 Viewer·SEO 설정

**Header**
| 이름 | 필수 여부 | 설명 |
|---|---|---|
| Cookie(세션) | 필수 | Auth.js 세션 쿠키 |

**Request Body**
```json
{
  "isPublished": true,
  "targetViewers": ["tech-blog"],
  "slug": "공개 경로",
  "metaDescription": "검색·공유용 설명"
}
```

**Response Body (성공)**
```json
{
  "pageId": "문서 ID",
  "isPublished": true,
  "slug": "공개 경로",
  "publishedAt": "게시 일시"
}
```

**Response (실패)**
| 상태 코드 | 사유 | 설명 |
|---|---|---|
| 400 | 잘못된 요청 | 게시 시 필수 SEO 정보(slug, metaDescription) 누락 |
| 401 | 인증 실패 | 세션 없음/만료 |
| 409 | slug 중복 | 다른 게시 문서와 slug가 중복됨 |
| 502 | 연동 실패 | Confluence API 호출 실패 |

### GET /api/viewer/posts — 게시 문서 목록 조회

**Header**
해당 없음(비로그인 공개)

**Request Body**
해당 없음

**Response Body (성공)**
```json
{
  "posts": [
    { "slug": "공개 경로", "title": "문서 제목", "publishedAt": "게시 일시" }
  ]
}
```

**Response (실패)**
| 상태 코드 | 사유 | 설명 |
|---|---|---|
| 502 | 연동 실패 | Confluence API 호출 실패 |

### GET /api/viewer/posts/{slug} — 게시 문서 상세 조회

**Header**
해당 없음(비로그인 공개)

**Request Body**
해당 없음

**Response Body (성공)**
```json
{
  "slug": "공개 경로",
  "title": "문서 제목",
  "html": "웹 뷰용으로 변환된 본문 HTML",
  "canonicalUrl": "대표 주소",
  "metaDescription": "검색·공유용 설명",
  "relatedPosts": [{ "slug": "관련 글 경로", "title": "관련 글 제목" }]
}
```

**Response (실패)**
| 상태 코드 | 사유 | 설명 |
|---|---|---|
| 404 | 문서 없음 | 존재하지 않거나 게시 해제된 slug |
| 502 | 연동 실패 | Confluence API 호출 실패 |

### GET /sitemap.xml — sitemap 생성

**Header**
해당 없음(비로그인 공개)

**Request Body**
해당 없음

**Response Body (성공)**
게시 문서의 canonical URL 목록을 포함한 sitemap XML 문서

**Response (실패)**
| 상태 코드 | 사유 | 설명 |
|---|---|---|
| 502 | 연동 실패 | 게시 문서 목록 조회 실패 |

### GET /robots.txt — robots 정책 제공

**Header**
해당 없음(비로그인 공개)

**Request Body**
해당 없음

**Response Body (성공)**
검색 허용 범위와 sitemap 위치를 포함한 정적 텍스트 응답

**Response (실패)**
해당 없음(정적 응답이므로 실패 케이스 없음)

### GET /rss.xml — RSS 피드 생성

**Header**
해당 없음(비로그인 공개)

**Request Body**
해당 없음

**Response Body (성공)**
최신 게시 문서 목록을 포함한 RSS XML 문서

**Response (실패)**
| 상태 코드 | 사유 | 설명 |
|---|---|---|
| 502 | 연동 실패 | 게시 문서 목록 조회 실패 |

### GET /api/comments — 댓글 목록(계층 포함) 조회

**Header**
해당 없음(비로그인 공개)

**Request Body**
해당 없음(쿼리스트링 `pageId` 필수)

**Response Body (성공)**
```json
{
  "comments": [
    {
      "commentId": "댓글 ID",
      "authorName": "작성자 표시명",
      "body": "댓글 본문",
      "createdAt": "작성 일시",
      "replies": []
    }
  ]
}
```

**Response (실패)**
| 상태 코드 | 사유 | 설명 |
|---|---|---|
| 400 | 잘못된 요청 | pageId 누락 |
| 502 | 연동 실패 | Confluence API 호출 실패 |

### POST /api/comments — 댓글·대댓글 작성

**Header**
| 이름 | 필수 여부 | 설명 |
|---|---|---|
| Cookie(세션) | 선택 | MS 로그인 사용자인 경우 세션으로 작성자 식별 |

**Request Body**
```json
{
  "pageId": "댓글이 달릴 문서 ID",
  "parentCommentId": "대댓글인 경우 부모 댓글 ID(선택)",
  "body": "댓글 본문",
  "authorName": "세션이 없는 경우 필수 입력",
  "authorEmail": "세션이 없는 경우 필수 입력"
}
```

**Response Body (성공)**
```json
{
  "commentId": "생성된 댓글 ID",
  "createdAt": "작성 일시"
}
```

**Response (실패)**
| 상태 코드 | 사유 | 설명 |
|---|---|---|
| 400 | 잘못된 요청 | 세션이 없는데 authorName/authorEmail 누락, 또는 이메일 형식 오류 |
| 404 | 문서 없음 | 존재하지 않는 pageId 또는 parentCommentId |
| 429 | 요청 과다 | 외부 사용자 rate limiting 초과(스팸성 댓글 방지) |
| 502 | 연동 실패 | Confluence API 호출 실패 |

## 작성 시 주의할 점 관련 근거

- Confluence 연동 API의 공식 문서는 Confluence Cloud REST API v2이며, 서비스 계정 API 토큰은 실제 값을 문서에 남기지 않고 서버 환경변수/시크릿 매니저로만 관리한다(architecture.md 보안 및 규정 준수 참고).
