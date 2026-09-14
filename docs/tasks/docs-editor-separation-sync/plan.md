## 접근 방식

문서 전용 정리 작업. 코드 변경 없음. 각 대상 문서를 전체 읽은 뒤, Editor 상세 서술 구간을 식별해 요약 문단 + 참조 링크로 치환한다. api-spec.md는 실제 코드(`src/app/api/**`, `src/lib/auth.ts`, `src/lib/ax-auth/client.ts`)를 대조해 사실과 다른 서술도 함께 바로잡는다.

## 영향 범위

- `docs/product/prd.md` — 화면 정의, 개발 스펙 정의, 기능별 정의, 단계별 개발 계획, 이관 체크리스트, API 여부 섹션
- `docs/product/api-spec.md` — 개요, 엔드포인트 목록 표, 엔드포인트 상세(ax-callback 포함 Editor 6개 엔드포인트 제거)
- `docs/product/architecture.md` — Editor 서비스 기술 스택 표
- 변경하지 않음: `requirements.md`, `data-spec.md`, `login-integration-guide.md`, `mail-integration-guide.md`, `docs/tasks/phase-*` 원문

## 데이터/인터페이스 영향

없음(문서 전용, 코드/API 동작 변경 없음). api-spec.md 수정은 문서를 실제 동작에 맞추는 정정이며 API 자체를 바꾸지 않는다.

## 검증 전략

- 코드 사실관계 대조: `Glob src/app/api/**`로 실제 존재하는 라우트만 api-spec.md에 남았는지 확인
- ax-callback 동작 대조: `src/app/api/auth/ax-callback/route.ts`, `src/lib/auth.ts` 재확인
- 문서 간 링크 무결성: 다른 문서가 이번에 축약한 prd.md/api-spec.md/architecture.md 섹션을 앵커 링크로 참조하지 않는지 grep으로 확인
- lint/build 등 코드 검증은 해당 없음(문서만 변경)

## 리스크

- Editor 상세 정보를 과도하게 삭제하면 이 저장소만 보고 전체 그림을 이해해야 하는 독자가 맥락을 잃을 수 있음 → 완화: 요약 문단에 Editor 저장소 및 관련 이력 문서(phase-e1-e2, phase-e3, phase-migration) 링크를 남겨 추적 가능하게 함
- api-spec.md 정정 중 실제 코드와 문서가 또 다른 지점에서 어긋날 가능성 → 완화: 정정 대상은 이번에 명확히 확인된 ax-callback 리다이렉트 동작에 한정하고, 그 외 불확실한 서술(예: 콜백 파라미터명 미검증)은 기존 주석을 유지
