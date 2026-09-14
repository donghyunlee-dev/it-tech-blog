## 완료된 범위

Editor가 완전히 별도 저장소(`sfood-it-editor`)에서 독립 개발되는 현재 상태에 맞춰, 이 저장소(Viewer)의 제품 문서 3종을 정리했다.

- **[docs/product/prd.md](../../product/prd.md)**: 화면 정의·개발 스펙 정의·기능별 정의·단계별 개발 계획의 "Editor 서비스" 섹션(기존 화면 표, 기능 8개 상세, Phase E1~E3 진행 상황)을 각각 한두 문단 요약으로 축소하고 Editor 저장소 및 관련 이력 문서(phase-e1-e2, phase-e3, phase-migration)로의 참조 링크를 남겼다. "이관(마이그레이션) 체크리스트"는 완료된 항목을 제거하고 "이력 요약 + 남은 과제 3건"으로 축약했다. Viewer 관련 섹션(화면 정의, 기능별 정의, Phase V1~V4)은 그대로 유지했다.
- **[docs/product/api-spec.md](../../product/api-spec.md)**: 이 저장소에 실제로 존재하지 않는 `/api/editor/*` 엔드포인트(폴더 확인/생성, 문서 목록/작성/수정, 이미지 등록, 게시 설정) 6개 상세 섹션과 목록 표 행을 제거했다. 겸사겸사 `GET /api/auth/ax-callback`의 응답 설명이 실제 코드와 어긋나 있던 부분(구 버전: `/editor`로 리다이렉트 + `TOKEN_EXPIRED` 등 사유별 분기 / 실제: `ax_return_to` 쿠키의 원래 게시글 경로로 복귀 + 사유 구분 없는 단일 실패 처리)을 실제 구현에 맞게 정정했다.
- **[docs/product/architecture.md](../../product/architecture.md)**: "Editor 서비스" 기술 스택 표를 요약 문단으로 축소하고, Viewer가 실제로 의존하는 접점(Confluence 데이터 구조, AX Auth 로그인 방식)만 명시했다. Viewer 기술 스택 표, 시스템 구성도, 데이터/인증/알림/배포 전략/트레이드오프 섹션은 서비스 전체를 이해하는 데 필요한 공유 맥락이라 그대로 유지했다.

`requirements.md`(원 요구사항 서술, 이미 분리 전제)와 `data-spec.md`(Editor가 쓰고 Viewer가 읽는 공유 Confluence 계약)는 사용자 확인에 따라 범위에서 제외해 변경하지 않았다.

## 주요 결정

- 사용자가 "요약 축소"를 명시적으로 선택 → Editor 상세 내용을 삭제하되, 추적 가능하도록 기존 phase task 문서(phase-e1-e2, phase-e3, phase-migration)로의 링크는 남기는 방식을 택함.
- `docs/tasks/phase-1~4`, `phase-e1-e2`, `phase-e3` 등 기존 task 문서 원문은 이동/삭제하지 않고 그대로 이력으로 보존 — PRD에서 이미 "참고 자료"로 표시되어 있었고, 이번 작업의 요청 범위(PRD 등 제품 문서 정리)를 벗어나는 별도 리팩터링이라고 판단.
- api-spec.md의 ax-callback 설명은 단순 축약이 아니라 실제 코드와 대조해 사실관계 오류를 함께 정정 — development-rules.md의 "문서를 실제 저장소 동작과 일치시킨다" 원칙에 따름.

## 변경 파일

- `docs/product/prd.md`
- `docs/product/api-spec.md`
- `docs/product/architecture.md`
- (신규) `docs/tasks/docs-editor-separation-sync/{spec,plan,tasks,test-result,result}.md`

## 열린 과제 / Next Steps

- prd.md에 남아 있는 "남은 과제" 2건(Editor 저장소 GitHub 원격/배포 구성, Viewer 배포 설정 정리)은 이번 문서 정리와 무관하게 여전히 미완료 상태 — 별도 작업으로 진행 필요.
- `docs/tasks/phase-1~4`, `phase-e1-e2-editor-login-crud`, `phase-e3-editor-ops-alert` 등 Editor 관련 과거 task 문서를 이 저장소에 계속 보관할지, Editor 저장소로 옮길지는 사용자가 아직 정하지 않은 별도 결정 사항으로 남겨둠(이번 작업 범위 밖).

### 후속 업데이트(2026-09-11)

AX Auth clientId 분리 과제는 확정으로 종료됨: 기존에 두 저장소가 임시로 공유하던 clientId는 원래 이 저장소(Viewer/Tech Blog, "blog")로 등록된 것이 맞다고 확인되어, 이 저장소는 clientId를 변경하지 않고 그대로 유지한다. Editor는 자신의 clientId를 별도로 재등록하도록 Editor 저장소 쪽에서 변경할 예정이며, 그 작업은 이 저장소의 과제 목록에서 제외했다. 반영 위치: [prd.md의 "남은 과제"](../../product/prd.md), [architecture.md의 "두 서비스 간 공유 요소"](../../product/architecture.md), [login-integration-guide.md의 "SFOOD IT Tech Blog 적용 시 참고 사항"](../../product/login-integration-guide.md).
