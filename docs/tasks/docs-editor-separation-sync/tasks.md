## 구현 작업

- [x] prd.md 상단 안내 문구를 "이관 완료 + 이 문서의 범위(Viewer 중심)"로 갱신
- [x] prd.md "화면 정의 > Editor 서비스 화면" 상세 표를 요약 문단으로 축소
- [x] prd.md "개발 스펙 정의 > Editor 서비스" 상세 불릿을 요약 문단으로 축소, 공통 API 참조 문구 갱신
- [x] prd.md "기능별 정의 > Editor 서비스 기능"(8개 기능 상세)을 요약 문단으로 축소
- [x] prd.md "단계별 개발 계획 > Editor 서비스"(Phase E1~E3 상세)를 요약 문단으로 축소
- [x] prd.md "이관(마이그레이션) 체크리스트"를 "이력 요약 + 남은 과제"로 축소
- [x] prd.md 말미 "API 여부" 안내를 Viewer 범위 명시로 갱신
- [x] api-spec.md 개요 문단을 Viewer 전용 범위로 갱신
- [x] api-spec.md 엔드포인트 목록 표에서 `/api/editor/*` 4개 행 제거
- [x] api-spec.md 엔드포인트 상세에서 `/api/editor/*` 6개 섹션(폴더 확인/생성, 문서 목록/작성/수정, 이미지 등록, 게시 설정) 제거
- [x] api-spec.md `GET /api/auth/ax-callback` 상세를 실제 코드 동작(원래 경로 복귀, 단일 실패 처리)에 맞게 정정
- [x] architecture.md "Editor 서비스" 기술 스택 표를 요약 문단으로 축소

## 테스트 작업

- [x] `Glob src/app/api/**/*`로 실제 라우트 목록 확인 후 api-spec.md와 대조
- [x] `src/app/api/auth/ax-callback/route.ts`, `src/lib/auth.ts` 읽고 콜백 리다이렉트/실패 처리 실제 동작 확인
- [x] grep으로 다른 문서의 prd.md/api-spec.md/architecture.md 앵커 링크 참조 여부 확인(해당 없음 확인)

## 문서 업데이트

- [x] `docs/tasks/docs-editor-separation-sync/{spec,plan,tasks,test-result,result}.md` 작성

## 진행 상태

완료. 코드 변경 없음.
