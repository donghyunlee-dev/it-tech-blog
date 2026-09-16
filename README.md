# SFOOD IT Tech Blog (Viewer)

에쓰푸드 IT팀·AX팀이 작성한 기술 문서를 누구나 로그인 없이 열람할 수 있는 공개 기술 블로그입니다. 문서 작성은 별도 저장소([`sfood-it-editor`](../sfood-it-editor))에서 이루어지고, 이 저장소는 Editor가 게시한 문서를 Confluence에서 읽어와 보여주는 **Viewer 전용** 서비스입니다.

## 서비스 구조

- **Editor**(별도 저장소): 사내 직원 전용 문서 작성 도구. MS 계정(AX Auth 경유) 로그인 후 Confluence에 문서를 쓰고 게시 상태를 관리합니다.
- **Viewer(이 저장소)**: 게시된 문서만 비로그인으로 공개 열람. 댓글 작성 시에만 일시적으로 AX Auth 로그인을 사용합니다.
- **Confluence**: 두 서비스가 공유하는 유일한 데이터 저장소(자체 DB 없음). Editor가 쓰고 Viewer는 읽습니다(댓글만 예외적으로 씀).

자세한 기획·설계는 아래 문서를 참고하세요.

| 문서 | 내용 |
|---|---|
| [docs/product/prd.md](docs/product/prd.md) | 서비스 정의, 화면·기능 정의, 단계별 개발 계획 |
| [docs/product/requirements.md](docs/product/requirements.md) | 최상위 요구사항 |
| [docs/product/architecture.md](docs/product/architecture.md) | 시스템 구성, 기술 스택, 트레이드오프 |
| [docs/product/data-spec.md](docs/product/data-spec.md) | Confluence 상 데이터 구조(Document/Publish Metadata/Comment) |
| [docs/product/api-spec.md](docs/product/api-spec.md) | 이 저장소가 제공하는 API 명세 |
| [docs/product/login-integration-guide.md](docs/product/login-integration-guide.md) | AX Auth 로그인 연동 가이드 |
| [docs/product/mail-integration-guide.md](docs/product/mail-integration-guide.md) | 댓글 알림 메일 발송 연동 가이드 |
| [docs/guide/design-direction.md](docs/guide/design-direction.md) | 에디토리얼 매거진 디자인 방향과 근거 |
| [docs/guide/design-system.md](docs/guide/design-system.md) | 디자인 토큰(색상·타이포·라운드·그림자) |

## 기술 스택

- **Next.js 16** (App Router, Turbopack) · **React 18.3.1** · TypeScript
- **@sfood/ui** — 사내 디자인 시스템(Tailwind CSS v3 기반). 댓글·검색 등 일부 화면 컴포넌트와 브랜드 컬러·폰트 토큰에 사용
- **Auth.js(NextAuth)** — 댓글 작성 시에만 트리거되는 AX Auth 경유 로그인 세션
- **Confluence Cloud REST API v2** — 유일한 데이터 저장소(자체 DB 없음)
- 배포: Vercel + GitHub Actions

## 시작하기

```bash
npm install
cp .env.example .env   # 값 채워넣기 — 아래 참고
npm run dev
```

`http://localhost:3000`에서 확인할 수 있습니다.

### 환경 변수

`.env.example`에 필요한 값과 설명이 정리되어 있습니다. Confluence 서비스 계정, AX Auth `clientId`/`clientSecret`(Editor와는 별개로 Viewer용으로 등록된 값), Slack Webhook URL 등이 필요합니다.

### 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 로컬 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드된 앱 실행 |
| `npm run lint` | ESLint 검사 |

## 디렉터리 구조

```
src/
  app/                # Next.js App Router 페이지·API Route Handlers
  components/         # 화면 컴포넌트(layout/posts/comments)
  lib/                # Confluence·AX Auth 클라이언트, 도메인 로직
docs/
  product/            # PRD·요구사항·아키텍처·데이터/API 명세
  guide/              # 디자인 시스템, 개발 규칙, 스펙 기반 워크플로 등 운영 가이드
  tasks/              # 작업 단위별 spec/plan/tasks/test-result/result 기록
```

## 작업 방식

이 저장소는 스펙 기반 워크플로([docs/guide/spec-driven-workflow.md](docs/guide/spec-driven-workflow.md))를 따릅니다. 의미 있는 변경은 `docs/tasks/{task-id}/`에 spec → plan → tasks → test-result → result 순서로 기록됩니다. 규칙 전반은 [CLAUDE.md](CLAUDE.md)를 참고하세요.
