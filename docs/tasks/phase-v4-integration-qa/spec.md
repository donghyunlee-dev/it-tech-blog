# spec — Phase V4 통합 QA

## 문제 정의

prd.md Phase V4 목표("리다이렉트·악용 방지를 마무리하고, Viewer를 통합 검증하여 안정적으로 배포한다")의 구성 기능(이상 감지 → Slack 알림, 게시 주소 변경/삭제 리다이렉트, 외부 댓글 rate limiting)은 각각 개별 PR([#7](https://github.com/sfood-pioneer-1st/sfood-it-tech-blog/pull/7), [#8](https://github.com/sfood-pioneer-1st/sfood-it-tech-blog/pull/8))과 Phase V3의 [#9](https://github.com/sfood-pioneer-1st/sfood-it-tech-blog/pull/9)로 구현·머지되었지만, 이들이 서로 겹치는 지점(예: 댓글 작성 흐름 안에서 rate limiting과 mail-token 리다이렉트가 함께 동작하는지)과 Phase V2까지의 기존 기능이 최근 변경들로 회귀되지 않았는지를 전체적으로 훑어본 기록은 없다.

## 범위 (In Scope)

- prd.md의 Phase V2·V3·V4 기능 정의를 체크리스트로 정리하고, 실 배포 데이터(현재 게시 문서 3건)로 홈/상세/댓글/SEO 엔드포인트를 다시 확인한다.
- 최근 3개 PR이 서로 간섭하지 않는지 확인한다(예: `/posts/[slug]`의 `?error=` 배너, 리다이렉트, 댓글 섹션이 한 페이지에서 함께 정상 동작하는지).
- 발견된 문제는 이 작업 범위 안에서 바로 수정한다(사소한 수정에 한함 — 새 기능 설계가 필요한 문제는 별도 과제로 분리).
- `docs/product/prd.md`의 Phase V4를 "완료"로 갱신(단, 실 계정 메일 알림 왕복처럼 사용자만 검증할 수 있는 항목은 예외로 명시).

## Out of Scope

- 태그 기반 필터링/검색, 최근 댓글 조회 확장성 개선, Confluence 네이티브 댓글 무시 안내 — 모두 신규 기능/개선이며 이 QA의 대상이 아니다(별도 과제로 남긴다).
- 실 MS 계정 로그인이 필요한 전 구간 검증(로그인→댓글 저장→메일 수신) — AI가 대신할 수 없어 이전 PR들에서 이미 "사용자 직접 검증 필요"로 명시되어 있다. 이 QA에서도 동일하게 취급한다.
- Editor 배포 파이프라인 등 이 저장소 범위 밖의 이관 후속 과제.

## 수용 기준

- [ ] Phase V2 기능(목록/상세/컨버터/SEO 엔드포인트/구조화 데이터/관련 글) 실 데이터 회귀 확인.
- [ ] Phase V3 기능(외부 사용자 댓글 작성, 대댓글 계층 조회) 실 데이터 회귀 확인.
- [ ] Phase V4 기능(rate limiting, 리다이렉트, Slack 알림 경로) 최근 병합분과 함께 정상 동작 확인.
- [ ] 발견된 문제는 수정하거나, 수정하지 않기로 한 이유와 함께 열린 과제로 기록한다.
- [ ] `npm run lint`/`npm run build` 통과.
