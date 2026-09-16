# test-result — Viewer publishMetadata/제목 조회 구조 수정

## 실행한 검증

| 항목 | 명령/방법 | 결과 |
|---|---|---|
| 버그 재현(수정 전) | 실 Confluence API로 `ITTECHBLOG` 스페이스의 15개 페이지 전수 조회, 각 페이지의 `publishMetadata`/`sourceDocument`/`authorMeta` content property 직접 curl 조회 | 1개 문서가 `isPublished:true`이지만 실제 구조가 `{isPublished, publishedAt, viewers:{"tech-blog":{slug,metaDescription,publicSlug}}}`로, 우리 코드가 찾던 평면 `slug` 필드가 없어 항상 필터링에서 빠짐을 확인. 페이지 자체 `title`도 UUID임을 확인 |
| 근본 원인 확인 | 배경 조사 에이전트로 `sfood-it-editor` 저장소의 `src/lib/editor/publish.ts`/`documents.ts` 소스를 직접 읽음(추측 아님) | `PublishMetadata`/`PublishViewerMetadata` 타입 정의, `publicSlug = ${slug}-${페이지 UUID}` 생성 로직, `sourceDocument.title`이 표시용 제목이라는 것, UUID 제목이 의도적 설계(P0-7)라는 것을 코드로 확인 |
| Lint | `npm run lint` | 통과 |
| 빌드/타입체크 | `rm -rf .next && npm run build` | 통과, 모든 라우트 정상 생성 |
| API 응답(수정 후) | `curl localhost:PORT/api/viewer/posts` | `{"posts":[{"slug":"instructions-0399ebbc-177a-4124-8c73-fdfe8a03cb71","title":"Gemini에 SFOOD 업무 지침 설정하기","publishedAt":"2026-09-15T04:11:16.229Z","metaDescription":"지침"}]}` — 실제 문서가 올바른 제목·slug로 반환됨 |
| 홈 화면(수정 후) | 브라우저 프리뷰 | 히어로에 실제 제목·요약·날짜가 정상 렌더링됨(UUID 아님) |
| 상세 페이지(수정 후) | `/posts/instructions-0399ebbc-177a-4124-8c73-fdfe8a03cb71` 접속 | 탭 제목·본문 제목·날짜·읽는 시간(2분)·본문 전체가 정상 렌더링됨. 콘솔 에러 없음 |
| 댓글 섹션(수정 후, 실 pageId) | 같은 페이지에서 댓글 섹션 확인 | "댓글 0개", 게이트("먼저 작성자를 확인해주세요")가 정상 노출됨. 이전 세션의 가짜 pageId 테스트와 달리 목록 조회 실패 없이 바로 "아직 댓글이 없습니다" — 실제 pageId가 유효함을 보여줌 |

## 검증하지 못한 것

- `sourceDocument`가 없는 문서에서의 UUID 제목 폴백 동작 — 현재 게시된 문서가 1건뿐이고 정상적으로 `sourceDocument`를 가지고 있어, 폴백 경로 자체는 코드 리뷰로만 확인했다(실제 그런 문서가 나타나면 재확인 필요).
- 댓글 알림 메일(`getDocumentNotificationMeta` 수정분)의 실제 발송 확인 — `login_token` 신선도 확보가 별도 미해결 과제(PRD에 기 명시)라 실제 메일 발송 자체를 이번에 재현하지 않았다. 타입체크와 로직 리뷰로만 확인했다.
