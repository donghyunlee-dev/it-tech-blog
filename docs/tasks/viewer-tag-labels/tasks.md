# tasks — 카테고리/태그 노출

## 조사

- [x] 실 Confluence API로 게시 문서의 레이블 데이터 직접 확인(다중 자유 태그임을 확인)

## 구현

- [x] `confluence/client.ts`에 `listPageLabels(pageId)` 추가(페이지네이션 대응)
- [x] `posts.ts`: 게시 문서마다 레이블 병렬 조회, `tags: string[]`(최대 3개) 노출
- [x] `PostCard`/`Hero`/상세 페이지에 태그 라인(`.kicker` 재사용) 추가
- [x] `data-spec.md`/`design-direction.md`를 실제 구조·설계 조정 내용으로 갱신

## 검증

- [x] `npm run lint`
- [x] `npm run build`
- [x] 실 게시 문서(레이블 있음/없음 각각)로 홈·상세 화면 확인

## 문서

- [x] `test-result.md` 작성
- [x] `result.md` 작성
