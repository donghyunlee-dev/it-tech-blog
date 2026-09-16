# Architecture: SFOOD IT Tech Blog

## 개요

사내 직원이 MS 계정(AX Auth 경유 사내 SSO)으로 로그인하여 문서를 작성하는 **Editor**와, 게시된 문서를 누구나 공개 열람할 수 있는 **Tech Blog(Viewer)**를 **별도로 개발·배포되는 두 개의 서비스**로 구성한다.

- **Editor**: 사내 IT 담당자·AX팀 전용 애플리케이션. 로그인 화면을 메인 진입점으로 하며, 로그인하지 않으면 어떤 화면도 사용할 수 없다. Confluence를 직접 컨트롤(문서 생성·수정·이미지 등록·게시 상태 설정)하는 콘텐츠 관리 도구다.
- **Viewer(Tech Blog)**: 비로그인 공개 서비스. 디자인과 문서 표현(가독성, SEO, 렌더링 품질)이 핵심이며, 문서 작성 기능은 없다. **Comment 기능을 포함**하되, 댓글을 작성하려는 시점에만 AX Auth 로그인을 일시적으로 사용해 Confluence에 댓글을 저장한다. 그 외의 열람 기능은 모두 비로그인으로 동작한다.

두 서비스는 코드·배포가 완전히 분리되며, **Confluence를 유일한 공유 저장소**로 사용해 Editor가 작성·게시한 문서를 Viewer가 읽어 노출한다.

> 이 결정은 이전 버전의 architecture.md가 "2주 일정" 사유로 Editor·Viewer를 하나의 Next.js 저장소로 통합했던 것을 재조정한 결과다. requirements.md는 처음부터 "Editor와 Viewer를 분리하여 동일한 Confluence 문서를 다른 형태의 Viewer에서도 활용할 수 있도록 한다"고 명시하고 있었고, 두 서비스의 성격(Editor=사내 전용 CMS 도구, Viewer=디자인 중심 공개 블로그)이 근본적으로 다르다는 점이 재확인되어 서비스 분리로 되돌렸다. 자세한 사유는 "트레이드오프 및 대안"의 "Editor/Viewer 통합 → 서비스 분리 재조정" 참고.

설계의 전제가 된 주요 답변은 다음과 같다.

- 실행 환경: 웹 브라우저 (URL 기반 공개 서비스, SEO 요구사항 존재)
- 사용자 규모: 소규모 팀(2~10명) — 동시성·확장성보다 단순한 구조와 빠른 구현을 우선
- 서비스 분리: Editor와 Viewer(Tech Blog)는 별도로 개발·배포되는 두 개의 애플리케이션. Comment는 Viewer에 포함된 기능이며 별도 서비스가 아니다.
- 데이터 저장: 별도 DB 없음 — Confluence가 저장소 역할을 전담. 두 서비스 모두 동일한 Confluence Space를 바라본다.
- 로그인: 사내 SSO(MS 계정). Editor는 전체 화면이 로그인 필수, Viewer는 댓글 작성 시에만 로그인 필요. Azure AD와 직접 OIDC 연동을 구성할 수 없어, 사내 공통 인증 서비스인 AX Auth가 Azure AD 로그인을 대행하고 그 결과(login_token)를 각 서비스가 검증하는 방식을 사용한다(상세: [login-integration-guide.md](login-integration-guide.md))
- 자동화: 이상 감지(Confluence 연동 실패 등 운영 이슈 탐지) → Slack으로 전달. 두 서비스가 각자 자신의 Confluence 호출 실패를 감지해 전달한다.
- 배포: 클라우드, 서비스별 독립 배포(스테이징 미분리), Git 기반 CI/CD
- 일정: 빠른 구축이 목표이나, 서비스 분리는 유지보수성과 요구사항 충족을 위해 우선한다
- 개발 리소스: AI(Claude)와 개발자 병행 — 아래 내용은 코드 수준 전문 용어와 개념 설명을 함께 제공한다

## 시스템 구성도

컴포넌트와 데이터 흐름을 텍스트로 정리하면 다음과 같다.

```
[사내 직원 브라우저]                              [외부 방문자/사내 직원 브라우저]
        |                                                    |
        | 로그인 필수(AX Auth 경유)                              | 로그인 없이 열람
        v                                                    v
   +--------------------+                          +---------------------------+
   |   Editor 서비스      |                          |   Viewer(Tech Blog) 서비스   |
   |   (별도 앱/배포)      |                          |   (별도 앱/배포)             |
   |   - 문서 작성/수정    |                          |   - 게시 문서 공개 열람        |
   |   - 이미지 등록       |                          |   - Comment 위젯            |
   |   - 게시 상태 설정    |                          |     (댓글 작성 시에만 AX 로그인) |
   +--------------------+                          +---------------------------+
        |                                                    |
        | 문서 CRUD, content properties 쓰기                    | 게시 문서 읽기 전용 조회
        |                                                    | + 댓글 CRUD(쓰기)
        v                                                    v
   +--------------------------------------------------------------------+
   |                        Confluence REST API                          |
   |  - 단일 서비스 계정으로 연결(두 서비스 모두 동일 계정 사용)                    |
   |  - 문서 본문, content properties(게시 경로/메타), 댓글(Comment ID 관계)     |
   +--------------------------------------------------------------------+
                        |                              |
                        v                              v
              [Editor 자체 이상 감지 → Slack]   [Viewer 자체 이상 감지 → Slack]
```

- Editor는 로그인한 사용자의 메일 계정 기준으로 Confluence Space 내 개인 폴더를 확인/생성한 뒤 문서를 작성·수정·게시한다. Editor가 유일하게 문서를 쓰는 경로다.
- Viewer는 Editor가 게시 상태로 전환한 문서만 조회하며, 검색엔진 노출을 위해 서버에서 HTML을 렌더링한다. Viewer는 문서 내용을 쓰지 않는다(댓글은 예외).
- Comment는 Viewer 안에 임베드되는 기능으로 별도 배포 단위가 아니다. MS SSO 사용자와 외부 방문자(이름·이메일 입력) 양쪽의 댓글을 모두 Confluence에 저장한다.
- 두 서비스는 별도 DB 없이 Confluence를 단일 진실 공급원(Source of Truth)으로 공유한다. 서로 API를 직접 호출하지 않고 Confluence를 통해서만 데이터를 주고받는다.

## 서비스별 기술 스택

### Editor 서비스 (참고 — 별도 저장소 `sfood-it-editor`에서 관리)

Next.js(React, TypeScript) 기반 독립 애플리케이션으로, 자체 DB 없이 Confluence Cloud REST API v2(+첨부파일 v1)에 문서·게시 메타데이터를 직접 쓴다. 앱 전체가 AX Auth 경유 로그인 필수이며, Editor 전용 도메인/프로젝트로 독립 배포된다. 이 표에 있던 기술 스택 세부 사항(선정 이유 포함)은 Editor 저장소 자체 문서로 이관되었으며, Viewer가 의존하는 접점은 Confluence 데이터 구조([data-spec.md](data-spec.md))와 AX Auth 로그인 방식([login-integration-guide.md](login-integration-guide.md))뿐이다.

### Viewer(Tech Blog) 서비스

| 영역 | 제안 | 선정 이유 |
|---|---|---|
| 프론트엔드/백엔드 | Next.js(React 18.3.1, TypeScript), Route Handlers | SEO를 위한 서버 렌더링(SSR/ISR)에 적합, 디자인·문서 표현에 집중. React는 사내 디자인 시스템 `@sfood/ui`의 peer dependency(`^18.0.0`)에 맞춰 19에서 18로 낮췄다(2026-09-15) |
| UI 컴포넌트/스타일 | `@sfood/ui`(사내 디자인 시스템, Tailwind CSS v3 기반) + 자체 CSS | 댓글·검색 등 일부 화면과 브랜드 컬러·폰트 토큰은 `@sfood/ui`를 사용하고, 에디토리얼 매거진 전용 레이아웃(마스트헤드·히어로·시리즈 위젯 등)은 대응 컴포넌트가 없어 자체 CSS로 구현한다 — 상세는 [design-system-adoption.md](../guide/design-system-adoption.md) 참고 |
| 데이터 저장 | 없음(Confluence API를 읽기 전용으로 조회) | 게시된 문서만 읽어 노출. Viewer의 반복 조회 성능을 위해 Next.js ISR/엣지 캐시로 Confluence 응답을 짧은 주기로 캐싱 |
| 인증 | AX Auth 경유 + Auth.js(NextAuth) — **댓글 작성 시에만 사용** | Viewer 열람 자체는 비로그인. Comment 작성 흐름 안에서만 AX Auth 로그인을 트리거하고, 그 결과로 댓글 작성자를 식별한다 |
| Confluence 연동 | Confluence Cloud REST API v2, 서비스 계정 API 토큰(Editor와 동일 계정) | 문서·게시 메타데이터는 읽기 전용, 댓글(Comment)만 쓰기 |
| 배포 환경 | Vercel(공개 도메인) | 검색엔진 노출이 필요한 공개 서비스이므로 독립된 공개 도메인으로 배포 |
| 운영 알림 | Slack Incoming Webhook | Viewer 자신의 Confluence 호출 실패(게시 문서 조회 실패, 댓글 저장 실패 등)를 감지해 운영팀에 알림 |

### 두 서비스 간 공유 요소

- **Confluence 데이터**: 유일한 공유 지점. Editor가 쓰고 Viewer가 읽는다(댓글은 Viewer가 쓴다).
- **AX Auth**: 두 서비스가 각자 독립적으로 AX Auth와 연동한다(각자 별도의 `clientId`로 AX팀에 등록). Editor는 상시 로그인 세션 용도로, Viewer는 댓글 작성 시 일시적 로그인 용도로 사용 방식이 다르다. 기존에 두 저장소가 임시로 공유하던 clientId는 원래 이 저장소(Viewer, "blog")로 등록된 것이 맞음을 확인했으며(2026-09-11), 이 저장소는 현재 clientId를 그대로 유지한다. Editor는 자신의 clientId를 별도로 재등록하도록 Editor 저장소 쪽에서 변경할 예정이다.
- **코드**: 두 서비스는 별도 저장소/애플리케이션이므로 코드를 공유하지 않는 것을 기본으로 한다. Confluence 클라이언트, AX Auth 클라이언트처럼 로직이 유사한 부분이 있더라도, 소규모 팀·단순한 구조 우선 원칙에 따라 각 서비스가 자신에게 필요한 부분만 독립적으로 구현한다(모노레포·공용 패키지 도입은 하지 않음 — 트레이드오프 참고).

## 데이터 및 인증

**데이터 저장 방식**
- 문서 본문: Editor가 Confluence 페이지로 저장. 사용자별 개인 폴더는 Confluence Space 하위에 자동 생성/연결.
- 게시 메타데이터: 공개 경로, SEO용 원본 정보는 Editor가 Confluence의 content properties에 저장하고, Viewer가 이를 읽어 페이지를 구성.
- 댓글: Viewer(Comment 기능)가 Confluence Comment API로 저장하되, 실제 작성자 정보(이름, 이메일 또는 MS 계정 정보)와 댓글 본문을 구조화하여 함께 기록(예: `이름 | 이메일 | 댓글`). 대댓글은 Comment ID/parentCommentId 관계로 저장.
- 자체 데이터베이스는 두지 않는다. 소규모 팀 규모와 짧은 일정을 고려할 때 DB 운영·마이그레이션 부담을 줄이는 것이 합리적이다.

**인증 방식**
- **Editor**: 앱의 모든 화면이 로그인 필수. Azure AD와 직접 OIDC 연동을 구성하지 않고, AX Auth가 Azure AD 로그인을 대행한 뒤 발급하는 `login_token`을 백엔드가 `clientSecret`과 함께 검증(리다이렉트 방식)하여 세션을 생성한다. 로그인 성공 시 확인되는 사용자 메일/이름을 실제 작성자 정보로 사용하고, Confluence에는 단일 서비스 계정으로 기록하되 애플리케이션 레벨에서 실제 작성자를 구분해 표시한다. 연동 상세는 [login-integration-guide.md](login-integration-guide.md) 참고.
- **Viewer 열람**: 인증 없이 게시된 문서만 공개 열람. 로그인 화면 자체가 존재하지 않는다.
- **Viewer 댓글(Comment)**: MS 로그인 사용자는 댓글 작성 버튼을 누르는 시점에 AX Auth 로그인을 거쳐 세션을 만들고, 그 세션 정보로 댓글을 작성한다. 외부 사용자는 로그인 없이 이름·이메일을 필수 입력받아 MS 계정 사용자와 동일한 구조(이름·이메일·댓글)로 저장한다. 이메일 형식 검증과 필수값 체크를 클라이언트/서버 양쪽에서 수행한다.

## 알림 및 자동화

- **댓글 알림 메일**: MS 로그인 사용자가 댓글을 작성하면, Viewer가 해당 문서(블로그 글) 작성자의 이메일로 알림 메일을 발송한다. 발신자는 항상 "그 순간 로그인되어 있는 댓글 작성자 계정"이며(AX Auth 메일 발송 정책상 고정 발신 계정 사용 불가), 댓글 생성 처리 흐름 안에서 그 세션의 `login_token`을 이용해 즉시 발송을 트리거한다(`login_token`은 발급 후 180초 이내·1회성이므로 지연 발송 불가). 외부(비로그인) 사용자 댓글은 AX Auth 로그인 세션이 없어 이 방식으로 발송할 수 없으므로 알림 대상에서 제외한다. 연동 상세는 [mail-integration-guide.md](mail-integration-guide.md) 참고.
- **이상 감지 자동화**: 두 서비스가 각자 자신의 Confluence API 호출 실패(게시 실패, 인증 만료, rate limit 초과 — Editor 측 / 게시 문서 조회 실패, 댓글 저장 실패 — Viewer 측), 외부 사용자의 비정상적 반복 요청(스팸성 댓글 — Viewer 측) 등을 감지해 각자의 Slack Webhook으로 운영팀에 전달한다. 이는 최종 사용자에게 노출되는 알림이 아니라 IT팀을 위한 운영 모니터링 성격의 자동화다.
- 정기 실행형 배치나 대량 리포트 발송은 요구사항에 없으므로 구현하지 않는다.

## 협업 및 운영 도구 연동

- **개발 AI Agent**: Claude(Code)를 활용해 개발을 진행하며, Editor/Viewer 각 서비스와 Confluence 연동 로직을 반복적으로 빠르게 구현·검증하는 데 활용한다.
- **업무 도구 연동**: Confluence(핵심 데이터 저장소, 필수), Slack(이상 감지 알림 채널)을 연동한다. Jira, Notion, MS Teams 등은 이번 범위에 포함하지 않는다.
- **버전 관리**: Git을 사용하며, 서비스별로 별도 저장소(또는 저장소 내 완전히 분리된 배포 단위)와 CI/CD 파이프라인을 구성한다.
- **테스트 환경 분리**: 두지 않는다. 대신 PR 단위 Preview 배포와 코드 리뷰를 최소한의 검증 수단으로 사용한다.

## 보안 및 규정 준수

- **개인정보 보호**: 외부 댓글 작성자의 이름·이메일은 개인정보에 해당하므로, 애플리케이션 로그에 평문으로 남기지 않고 마스킹 처리한다. 수집 목적(댓글 작성자 식별)에 한해서만 사용하고 별도 DB에 보관하지 않으며 Confluence에만 저장한다. Viewer는 문서 작성자의 실제 이메일(`actualAuthorEmail`)을 공개 화면·구조화 데이터 어디에도 노출하지 않는다.
- **접근 통제**: Confluence 서비스 계정의 API 토큰은 두 서비스 모두 서버 환경변수/시크릿 매니저에만 저장하고 클라이언트에 노출하지 않는다. Editor는 앱 전체가 사내 SSO 인증을 통과한 세션에서만 접근 가능하다.
- **세션 보안**: 로그인 세션 쿠키는 `httpOnly`, `secure`, `SameSite=Lax` 이상으로 설정한다.
- **악용 방지**: Viewer의 외부 사용자 댓글 작성 엔드포인트에는 기본적인 요청 빈도 제한(rate limiting)을 적용해 스팸성 댓글 및 무차별 API 호출을 방지한다.

## 배포 전략

- **서비스별 독립 배포**: Editor와 Viewer(Tech Blog)는 별도의 배포 단위(별도 Vercel 프로젝트, 별도 도메인)로 운영한다. Editor는 사내 접근 전제의 도메인, Viewer는 검색엔진에 노출되어야 하는 공개 도메인을 사용한다.
- **일정 및 개발 리소스 반영**: 아래 순서로 최소 기능부터 단계적으로 구축한다.
  1. Editor: 로그인 연동 + Confluence 서비스 계정 연결 확인, 개인 폴더/문서 작성·수정·게시 상태 설정
  2. Viewer: 게시된 문서 조회 및 렌더링, 기본 SEO(고유 URL, sitemap.xml, robots.txt, canonical URL)
  3. Viewer: Comment 기능(MS 계정/외부 사용자 댓글 작성, 대댓글 계층 구성)
  4. 양쪽 서비스: 이상 감지 → Slack 알림, 리다이렉트 처리, rate limiting, 통합 QA
- AI(Claude)와 개발자가 병행하는 구조이므로, 화면·API 단위로 작게 나누어 AI가 초안을 생성하고 개발자가 Confluence 연동·인증 등 핵심 로직을 검증하는 방식으로 진행하면 완료 가능성을 높일 수 있다.

## 트레이드오프 및 대안

- **Editor/Viewer 통합 → 서비스 분리 재조정**: 이전 버전의 architecture.md는 "2주 일정"을 이유로 Editor와 Viewer를 하나의 Next.js 저장소·배포로 통합했다. 그러나 requirements.md가 처음부터 "Editor와 Viewer를 분리하여 동일한 Confluence 문서를 다른 형태의 Viewer에서도 활용할 수 있도록 한다"고 명시하고 있었고, 실제로 (1) Editor는 로그인이 필수인 사내 전용 CMS 도구, (2) Viewer는 비로그인 공개 + 디자인·문서 표현이 핵심인 서비스로 목적과 사용자층이 근본적으로 다르다는 점이 재확인되어, 두 개의 독립된 서비스로 되돌렸다. 기존에 하나의 저장소에 구현되어 있던 코드(`src/app/editor/*`, `src/lib/editor/*` 등)는 Editor 전용 저장소/애플리케이션으로 이관해야 하며, 이 저장소는 Viewer(Tech Blog) 전용으로 정리한다. 이관 계획은 [prd.md](prd.md)의 "단계별 개발 계획"과 "이관(마이그레이션) 체크리스트" 참고.
- **모노레포 대신 완전 분리**: Editor와 Viewer 사이에 실질적으로 공유되는 코드는 많지 않다(Confluence 클라이언트도 Editor는 쓰기 위주, Viewer는 읽기 위주로 상당 부분 다름). 모노레포(turborepo/pnpm workspace 등)로 코드를 공유하는 방식도 검토했으나, 소규모 팀·단순한 구조 우선 원칙에 비춰볼 때 툴링 복잡도만 늘어난다고 판단해 각 서비스가 완전히 독립된 저장소로 각자 필요한 코드를 구현하는 방식을 택했다.
- **자체 DB 미도입 vs 캐시 계층 도입**: 요구사항과 사용자 규모(소규모 팀)를 고려해 자체 DB를 두지 않기로 했다. 다만 댓글/문서 수가 늘어나 Confluence API 반복 호출이 느려지면, 원 요구사항에서 언급한 대로 "전체 댓글을 한 번에 조회 후 계층 구성"하는 방식이나 짧은 TTL의 캐시(ISR)를 우선 도입하고, 그래도 부족하면 그때 경량 캐시 저장소(Redis 등) 도입을 재검토한다.
- **Vercel vs Azure 계열 배포**: 회사가 이미 Microsoft 생태계(Entra ID)를 사용 중이므로 Azure App Service/Static Web Apps가 사내 네트워크 정책·인증 연동 측면에서 더 자연스러울 수 있다. 다만 Next.js와의 즉시성(Zero-config 배포, Git 연동) 때문에 Vercel을 우선 제안했다. 사내 보안 정책상 클라우드 벤더 제약이 있다면 Azure 계열로 전환을 검토해야 한다.
- **스테이징 환경 부재**: 빠른 일정을 위해 별도 스테이징 환경을 두지 않기로 했으나, 이는 프로덕션 장애 위험을 감수하는 결정이다. PR Preview 배포와 코드 리뷰로 최소한의 안전장치를 두되, 서비스 안정화 이후에는 스테이징 환경 도입을 재고할 것을 권장한다.
- **댓글 알림 메일 발송 방식**: AX Auth 메일 발송 기능은 고정 서비스 계정이 아닌 "그 순간 로그인한 사용자" 명의로만 발송할 수 있고 `login_token`이 180초·1회성이므로, 댓글 생성 시점에 즉시 발송을 트리거하는 구조로만 구현 가능하다. 이 제약으로 인해 로그인하지 않은 외부 사용자의 댓글에는 알림 메일을 적용하지 못한다.
