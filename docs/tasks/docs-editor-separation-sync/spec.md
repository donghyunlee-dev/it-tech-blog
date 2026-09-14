## 문제

Editor는 2026-08-19~20에 별도 저장소(`sfood-it-editor`)로 완전히 분리되어 그 이후 독립적으로 기획·개발되고 있다. 그런데 이 저장소(Viewer)의 `docs/product/prd.md`, `api-spec.md`, `architecture.md`는 여전히 통합 저장소 시절 작성된 Editor의 화면 정의·기능별 상세·Phase E1~E3 진행 상황·API 엔드포인트·기술 스택 세부 사항을 그대로 담고 있어, 문서 구조가 실제 코드/조직 구조(완전 분리)와 어긋난다. 또한 `api-spec.md`의 AX Auth 콜백 응답 설명(`/editor`로 리다이렉트, `TOKEN_EXPIRED` 등 사유별 분기 처리)이 실제 구현(`src/app/api/auth/ax-callback/route.ts`, `src/lib/auth.ts` — `ax_return_to` 쿠키 기반 원래 경로 복귀, 사유 구분 없는 단일 실패 처리)과도 어긋나 있었다.

## 비즈니스 맥락

Editor 저장소가 자체 문서를 갖추게 된 이상, 이 저장소의 문서에 Editor 구현 상세를 중복 유지하는 것은 유지보수 부담만 늘리고 실제 상태와 어긋날 위험을 키운다. 이 저장소는 Viewer(Tech Blog) 전용으로 정리되었으므로, 문서도 Viewer 관점을 중심으로 재편하고 Editor는 "Viewer가 의존하는 접점(Confluence 데이터 구조)"만 참조하도록 정리한다.

## 범위

- `docs/product/prd.md`: Editor 화면 정의·기능별 정의·Phase E1~E3 진행 상황·이관 체크리스트를 요약 축소하고, Editor 저장소를 참고 대상으로 명시
- `docs/product/api-spec.md`: 이 저장소에 실제로 존재하지 않는 `/api/editor/*` 엔드포인트 상세를 제거하고, AX Auth 콜백(`/api/auth/ax-callback`) 설명을 실제 구현에 맞게 수정
- `docs/product/architecture.md`: Editor 기술 스택 표를 요약 축소

## 범위 제외

- `docs/product/requirements.md`: 원 요구사항 서술 문서로 이미 Editor/Viewer 분리를 전제로 작성되어 있어 변경하지 않음
- `docs/product/data-spec.md`: Editor가 쓰고 Viewer가 읽는 공유 Confluence 데이터 계약을 설명하는 문서로, Editor 구현 상세가 아니라 양쪽 서비스가 함께 의존하는 계약이므로 유지
- `docs/tasks/phase-*` 하위의 기존 task 문서(spec/plan/tasks/test-result/result) 원문 수정 또는 이동/보관 위치 변경 — 이력 보존을 위해 그대로 둠
- 코드 변경 — 문서만 정리하며 동작 변경 없음

## 사용자 시나리오

- PRD/architecture/api-spec을 열어보는 사람은 "Editor 관련 내용이 왜 이렇게 상세히 남아 있는지" 혼란 없이, 이 저장소가 Viewer 전용이며 Editor는 별도 저장소에서 관리된다는 것을 즉시 파악할 수 있어야 한다.
- 이 저장소의 API를 연동/점검하려는 사람은 api-spec.md에서 실제 존재하는 엔드포인트만 확인할 수 있어야 한다.

## 완료 조건(Acceptance Criteria)

- prd.md의 Editor 화면 정의/기능별 정의/Phase E1~E3 섹션이 각각 한두 문단 수준으로 축약되고, Editor 저장소 및 관련 이력 문서로의 참조 링크를 포함한다.
- prd.md의 이관 체크리스트가 "완료 이력 요약 + 남은 과제"로 축약된다.
- api-spec.md에 `/api/editor/*` 엔드포인트 상세가 더 이상 존재하지 않는다.
- api-spec.md의 `GET /api/auth/ax-callback` 설명이 실제 코드 동작(원래 게시글 경로로 복귀, 사유 미분기 단일 실패 처리)과 일치한다.
- architecture.md의 Editor 기술 스택 표가 요약 문단으로 대체된다.
- 코드/동작 변경 없음, 기존 링크(다른 문서에서 prd.md/api-spec.md/architecture.md의 특정 섹션을 참조하는 경우)가 깨지지 않는다.

## 엣지 케이스

- 다른 문서(data-spec.md, login-integration-guide.md, mail-integration-guide.md, phase-* 문서)에서 이번에 축약된 섹션을 앵커링해 참조하는 경우가 없는지 확인 필요 — 검토 결과 섹션 제목이 아닌 파일 단위 링크만 존재해 영향 없음.

## 가정

- "요약 축소"는 사용자가 명시적으로 선택한 옵션이며, Editor 상세 내용은 삭제하되 이력 추적을 위한 링크(phase-e1-e2, phase-e3, phase-migration 등 기존 task 문서)는 유지한다.
