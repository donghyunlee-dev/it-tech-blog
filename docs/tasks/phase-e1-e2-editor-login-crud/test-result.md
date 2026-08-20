# Test Result — Phase E1/E2: Editor AX Auth 로그인 연동 및 문서 CRUD 검증

## 정적 검증

- `npm run lint`: 통과(경고/오류 없음).
- `npm run build`: 통과. 신규 `DELETE /api/editor/documents/[pageId]` 라우트가 정상적으로 동적 라우트로 포함됨을 라우트 목록에서 확인.

## 로그인 리다이렉트 흐름 (실 브라우저 테스트)

- `/login` 접속 → "MS 계정으로 로그인" 링크의 `href`가 다음과 같이 생성됨을 확인:
  `https://ax-auth.s-food.ai/auth/login/sfood-it-tech-blog?redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fax-callback`
  → 팝업이 아닌 전체 페이지 이동(anchor 태그) 방식이며, clientId/redirect_uri가 `.env`에 설정된 실 값으로 정확히 채워짐을 확인.
- 링크 클릭 → AX Auth 서비스를 거쳐 실제 `https://login.microsoftonline.com`(제목: "사용자 계정 로그인")까지 정상 도달함을 확인. 이는 AX Auth 팀에 등록된 clientId(`sfood-it-tech-blog`)가 유효하고, 리다이렉트 흐름이 설계대로(팝업 아님, 버튼 클릭 → 서비스 호출 → 콜백 경로 이동) 동작함을 의미한다.
- **실 MS 계정 자격증명 입력은 보안 정책상 수행하지 않았다** — 이 지점 이후(로그인 완료 → `login_token`을 담아 `/api/auth/ax-callback`으로 리다이렉트 → NextAuth 세션 발급)는 사용자가 직접 완료해야 확인 가능하다.

## Editor 문서 API 인증 경계 (curl)

| 요청 | 결과 |
|---|---|
| `GET /api/editor/documents` (세션 없음) | 401 |
| `POST /api/editor/documents` (세션 없음) | 401 |
| `PUT /api/editor/documents/123` (세션 없음) | 401 |
| `DELETE /api/editor/documents/123` (세션 없음) | 401 |

→ 모든 Editor 문서 API가 세션 없이는 401로 거부됨을 확인(`requireSessionEmail` 인증 경계 정상 동작).

## 문서 CRUD — 실 Confluence 연동 통합 테스트

Next.js 앱 밖에서, `src/lib/editor/documents.ts`/`folder.ts`가 호출하는 것과 동일한 Confluence v2 API 시퀀스를 실 자격증명(`.env`)으로 재현하는 스크립트를 스크래치패드에 작성해 실행했다(저장소에는 커밋하지 않음). 대상은 실제 `ITTECHBLOG` space이며, 테스트용으로 생성한 페이지는 테스트 종료 후 모두 삭제(정리)했다.

| 단계 | 결과 |
|---|---|
| 1. Space 조회(`GET /api/v2/spaces?keys=ITTECHBLOG`) | 성공 |
| 2. 테스트용 개인 폴더 생성(`POST /api/v2/pages`, space 홈페이지 하위) | 성공 |
| 3. 문서 생성(Create, `POST /api/v2/pages`) | 성공, version=1 |
| 4. 생성 결과 재조회(Read) | 성공, 본문 내용 일치 |
| 5. 문서 수정(Update, `PUT /api/v2/pages/{id}`) | 성공, version=2 |
| 6. 수정 결과 재조회(Read) | 성공, 수정된 본문 반영 확인 |
| 6-1. 구버전 번호로 재수정 시도 | 기대대로 `409 CONFLICT`("Version must be incremented...") — `updateDocument`의 버전 충돌 감지(`ConflictError`)와 일치하는 서버 동작 확인 |
| 7. 문서 삭제(Delete, `DELETE /api/v2/pages/{id}`) | 최초 1회 시도에서 `500 Internal Server Error` 발생, 수 초 뒤 동일 요청 재시도 시 `204` 성공. 두 번째 전체 실행(폴더 재사용)에서는 최초 시도부터 `204` 성공. Confluence Cloud 측 일시적 지연으로 추정(아래 "관찰된 이슈" 참고) |
| 8. 삭제 후 목록 조회(`GET /api/v2/pages/{parentId}/children`) | 삭제된 문서가 목록에서 제외됨을 확인 |
| 9. 삭제된 문서 직접 조회 | `200`으로 여전히 조회되나 `status` 필드가 `"trashed"`, `parentId`가 `null`로 확인 — Confluence v2의 DELETE는 완전 영구 삭제가 아닌 휴지통 이동이며, 목록/자식 조회에서는 정상적으로 제외됨을 확인 |

**결과: 문서 생성·조회·수정·버전 충돌 감지·삭제·삭제 후 목록 제외까지 전체 흐름이 실제 Confluence 인스턴스에서 정상 동작함을 확인했다.**

### 관찰된 이슈: DELETE 최초 호출의 간헐적 500

- 재현: 문서를 방금 생성·수정한 직후 바로 `DELETE`를 호출했을 때 1회 발생. 수 초 후 동일 요청 재시도 시 즉시 `204`로 성공. 이후 재실행(생성 후 바로 삭제, update 단계 없이 진행하는 경로는 없었음)에서는 재현되지 않았다.
- 판단: 우리 쪽 요청 형식 문제가 아니라(같은 요청을 그대로 재시도해 성공) Confluence Cloud 서버 측의 일시적 지연/인덱싱 지연으로 추정된다.
- 조치하지 않은 이유: 1회 관찰만으로는 재현 조건이 불명확하고, 여기서 재시도 로직을 추가하면 "일어날 수 없는 상황에 대한 방어 코드를 넣지 않는다"는 리포지토리 원칙과 배치된다. 실사용 중 반복 재현되면 그때 `deletePage`에 단순 재시도(예: 1회 재시도 후 실패 시 502)를 추가하는 것을 고려한다.

## 미검증 항목

- 실 MS 계정 로그인 완료 후, 발급된 세션으로 Editor UI(`/editor` 문서함, `/editor/new` 작성 폼, `/editor/{pageId}` 수정 화면, 삭제 버튼 클릭)를 브라우저에서 직접 조작하는 전체 E2E는 사용자의 로그인 완료가 필요해 이번 세션에서 확인하지 못했다.
- 댓글 알림 메일의 신선한 `login_token` 확보 UX는 이번 작업 범위 밖(이전부터 열린 과제로 유지).
