# tasks — Viewer publishMetadata/제목 조회 구조 수정

## 조사

- [x] 실 Confluence API로 스페이스/페이지/content property 직접 조회해 버그 재현·원인 확인
- [x] 백그라운드 에이전트로 Editor 저장소(`sfood-it-editor`) 소스 직접 확인(추측 배제)
- [x] 사용자 확인("editor에서 변경된 내용이 맞다")

## 구현

- [x] `publish-metadata.ts` 타입 실제 구조로 교체
- [x] `posts.ts`: `sourceDocument.title`/`viewers[VIEWER_ID].publicSlug` 기반으로 조회 로직 수정
- [x] `comments.ts`의 `getDocumentNotificationMeta` 동일 수정
- [x] `category`/`series` 관련 타입·컴포넌트·CSS 제거(`SeriesWidget.tsx` 삭제 포함)
- [x] `docs/product/data-spec.md` 실제 구조로 갱신

## 검증

- [x] `npm run lint`
- [x] `npm run build`
- [x] `/api/viewer/posts`가 실제 문서를 반환하는지 curl로 확인
- [x] 브라우저로 홈 히어로·상세 페이지·댓글 섹션 실제 렌더링 확인

## 문서

- [x] `test-result.md` 작성
- [x] `result.md` 작성
