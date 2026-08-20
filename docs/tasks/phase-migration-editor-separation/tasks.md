# Tasks — 이관(마이그레이션): Editor/Viewer 저장소 분리

## 새 저장소(sfood-it-editor) 구성

- [x] 디렉토리 생성 및 Editor 관련 파일 전체 복사
- [x] package.json/tsconfig.json/next.config.ts/eslint.config.mjs/.gitignore/README.md 신규 작성
- [x] layout.tsx(제목 변경), 루트 page.tsx(신규 — 로그인 세션 기반 리다이렉트) 작성
- [x] .env.example 조정, 실 .env 값 필터링 복사(값 미노출)
- [x] `npm install` 실행
- [x] `npm run lint` 실행 — 통과
- [x] `npm run build` 실행 — 통과, 예상 라우트 전부 생성 확인
- [x] 개발 서버(포트 3100)로 `/login` 페이지 확인 — 실 AX Auth clientId로 링크 렌더링됨
- [x] git init 및 초기 커밋(로컬 커밋만)

## 원본 저장소(Viewer) 정리

- [x] `src/lib/errors.ts` 신설(ValidationError/NotFoundError/ConflictError/UnauthorizedError)
- [x] `src/lib/viewer/publish-metadata.ts` 신설(PublishMetadata 타입)
- [x] 5개 파일의 `@/lib/editor/errors`, `@/lib/editor/publish`, `@/lib/auth-guard` import를 새 경로로 수정
- [x] Editor 전용 디렉토리/파일 삭제(`src/lib/editor`, `src/lib/auth-guard.ts`, `src/app/editor`, `src/components/editor`, `src/app/api/editor`, `src/app/login`)
- [x] (실수 정정) `src/lib/notifications` 오삭제 후 복원
- [x] `src/lib/confluence/client.ts`를 읽기 위주 함수만 남도록 정리
- [x] `src/app/robots.ts`의 disallow 목록에서 `/editor`, `/login` 제거
- [x] `npm run lint` 실행 — 통과
- [x] `npm run build` 실행 — 통과, Editor 관련 라우트 전부 사라짐 확인
- [x] 브라우저로 `/`(정상 렌더링), `/login`(404) 확인

## 문서화 작업

- [x] `docs/product/prd.md` 이관 체크리스트 갱신
- [x] `docs/tasks/phase-migration-editor-separation/{spec.md,plan.md,tasks.md,test-result.md,result.md}` 작성

## 진행 상태

로컬 저장소 분리 완료. GitHub 원격 저장소 생성/push, AX Auth clientId 분리 등록은 사용자가 별도로 진행하기로 함(result.md "Next Steps" 참고).
