# Spec — Phase 4: Comment 기능

## 문제 정의

`docs/product/prd.md`의 Phase 4(Comment 기능)는 MS 로그인 사용자와 외부(비로그인) 사용자 모두 Viewer 문서에 댓글·대댓글을 작성하고 계층 구조로 열람할 수 있게 하는 것을 목표로 한다. 현재 저장소에는 Comment 관련 코드가 전혀 없다.

## 비즈니스 배경

- 관련 문서: [prd.md](../../product/prd.md)(Phase 4 기능별 정의·체크리스트), [architecture.md](../../product/architecture.md)(댓글 저장 방식), [data-spec.md](../../product/data-spec.md)(Comment 엔티티), [api-spec.md](../../product/api-spec.md)(`GET/POST /api/comments`), [mail-integration-guide.md](../../product/mail-integration-guide.md)(댓글 알림 메일)
- Confluence에는 단일 서비스 계정으로만 접속하므로, 실제 작성자(MS 로그인 사용자 또는 외부 사용자)는 Confluence의 "작성자" 필드가 아니라 댓글 본문에 `이름 | 이메일 | 댓글` 형태로 구조화하여 함께 기록한다(architecture.md).

## 범위 (In Scope)

1. MS 로그인 사용자 댓글 작성
2. 외부 사용자(이름·이메일 입력) 댓글 작성
3. 대댓글 및 댓글 계층 조회
4. 댓글 조회 성능 최적화
5. 댓글 알림 메일 발송(모범 사례 수준 — 아래 "가정 및 미확인 사항" 참고)

### 3·4 통합 처리에 대한 결정

prd.md는 "대댓글 및 댓글 계층 조회"(3)와 "댓글 조회 성능 최적화"(4)를 순차적인 두 단계(먼저 단순 재귀 조회 구현 → 나중에 전체 조회 후 메모리 구성으로 전환)로 정의했다. 이번 작업은 처음부터 구현하는 상황이라 두 단계를 나눠 만들 이유가 없고, "전체 조회 후 메모리에서 계층 구성"이 코드도 더 단순하므로 처음부터 이 방식 하나로 두 체크리스트 항목을 함께 충족한다.

## 범위 제외 (Out of Scope)

- **외부 댓글 작성 엔드포인트 rate limiting**: prd.md Phase 5에 별도 체크리스트 항목으로 있어 이번 범위에서 제외한다.
- **댓글 수정·삭제**: requirements.md·prd.md 어디에도 명시되어 있지 않아 범위에 포함하지 않는다.
- **댓글 알림 메일의 완전한 트리거 설계**: 사용자가 이전 대화에서 "로그인 후 메일 보내는 기능 구현 시 테스트하면서 적용 여부를 다시 판단하겠다"고 명시했다. AX Auth의 `login_token`은 발급 후 180초·1회성이라, 댓글 작성 시점에 항상 신선한 토큰을 확보할 수 있는 구조(예: 댓글 제출 직전 AX Auth 팝업 재인증)는 아직 프런트엔드에 없다. 이번 작업은 POST 요청에 선택적 `loginToken` 필드를 받아 그 값이 있을 때만 발송을 시도하는 배선(wiring)까지만 구현하고, 항상 신선한 토큰을 확보하는 UX 설계는 다루지 않는다.

## 사용자/운영자 시나리오

- 로그인한 사내 직원이 Viewer 문서 상세 화면에서 댓글을 작성하면, 세션의 이메일/이름이 작성자로 기록된다.
- 로그인하지 않은 방문자가 이름·이메일을 입력하고 댓글을 작성하면, 입력값이 작성자로 기록된다(형식 검증 포함).
- 댓글에 답글을 달면 원 댓글의 자식으로 계층 구조에 표시된다.
- 댓글 목록은 문서당 1회의 조회로 전체 댓글을 가져온 뒤 메모리에서 계층을 구성해 반환한다.
- MS 로그인 사용자가 댓글을 작성하면, 요청에 유효한 `loginToken`이 함께 전달된 경우에 한해 문서 작성자에게 알림 메일 발송을 시도한다. 실패하거나 토큰이 없으면 조용히 건너뛰고 댓글 작성 자체는 그대로 성공한다.

## 완료 기준(Acceptance Criteria)

- `npm run lint`, `npm run build`가 Confluence/AX Auth 자격증명 없이 성공한다.
- `GET /api/comments`, `POST /api/comments`가 api-spec.md 명세대로 구현되어 있다.
- Viewer 문서 상세 화면에 댓글 목록·답글·작성 폼(로그인/비로그인 겸용) 위젯이 포함되어 있다.
- 외부 사용자 댓글 작성 시 이름·이메일 누락 또는 형식 오류를 서버에서 차단한다(400).
- 댓글 알림 메일 발송 실패가 댓글 저장 자체를 실패시키지 않는다.
- 공개 `GET /api/comments` 응답에 `authorEmail`이 노출되지 않는다(개인정보 보호, api-spec.md 응답 스키마와 일치).

## 엣지 케이스

- 댓글이 없는 문서: 빈 배열 반환.
- 부모 댓글이 삭제된 경우에도 하위 댓글 계층은 유지되어야 한다(prd.md 예외 상황) — 이번 구현에는 댓글 삭제 기능이 없으므로 해당 없음이지만, 향후 삭제 기능 추가 시 이 규칙을 지켜야 한다는 점을 코드 주석으로 남긴다.
- 존재하지 않는 `pageId`/`parentCommentId`로 댓글 작성 시 404.
- 세션이 있는데 요청 본문에 `authorName`/`authorEmail`이 함께 온 경우, 세션 정보를 우선하고 클라이언트가 보낸 값은 무시한다(신원 위장 방지).

## 가정 및 미확인 사항

- **Confluence footer comment API 스펙 추정**: Confluence Cloud REST API v2의 footer comment 생성(`POST /api/v2/footer-comments`)·조회(`GET /api/v2/pages/{id}/footer-comments`) 엔드포인트와 `parentCommentId` 필드 지원 여부는 실제 Confluence 인스턴스로 검증되지 않았다. 기존 페이지/content properties 호출과 동일한 `confluenceRequest` 헬퍼와 인증 방식을 재사용했다.
- **구조화 본문 파싱**: `이름 | 이메일 | 댓글` 형식으로 저장하고 파싱한다. 댓글 본문 자체에 `|` 문자가 포함될 수 있으므로, 앞의 두 구분자까지만 분리하고 나머지는 모두 본문으로 취급한다.
- **댓글 알림 메일 트리거는 미완성 상태로 남음**: 위 "범위 제외" 참고.
