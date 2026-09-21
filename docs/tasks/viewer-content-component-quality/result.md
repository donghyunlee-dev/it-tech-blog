# result — Phase 1 (이미지 복구 + 코드 구문 강조)

## 요약

spec.md의 P0 두 건을 처리했다.

1. **인라인 이미지 복구**: `converter.ts`가 `ac:image`(첨부/외부 URL) 매크로를 전혀 처리하지 않아 본문에서 이미지가 완전히 사라지던 버그를 고쳤다. 첨부 이미지는 Confluence 인증이 필요해 새 프록시 라우트(`/api/attachments/[pageId]/[filename]`)를 통해 서버가 대신 인증해 스트리밍한다.
2. **코드 구문 강조**: `shiki`를 도입해 `code` 매크로의 `language` 파라미터를 살려 서버 사이드로 하이라이팅한다. 언어를 모르는 코드(Editor 네이티브 `<pre><code>`, 매크로를 거치지 않음)는 기존처럼 무강조로 유지된다(범위 밖).

## 변경 파일

- `src/lib/viewer/converter.ts` — `convertImages`(신규), `highlightCode`/`extractMacroParam`(신규), `convertMacros`가 code 매크로에서 shiki를 호출하도록 변경, `convertStorageToHtml`이 `pageId` 인자를 받는 async 함수로 변경.
- `src/lib/viewer/posts.ts` — `convertStorageToHtml` 호출부에 `page.id` 전달 + `await` 추가.
- `src/lib/confluence/client.ts` — `listPageAttachments`, `fetchConfluenceAttachment` 신규.
- `src/app/api/attachments/[pageId]/[filename]/route.ts` — 신규 프록시 라우트.
- `src/app/globals.css` — `.article-body img` 스타일 신규.
- `package.json`/`package-lock.json` — `shiki` 의존성 추가.

## 구현 중 발견한 것 (계획과 달랐던 점)

plan.md는 첨부 다운로드 인증 방식을 "조사 필요"로 남겨뒀는데, 구현하며 실측한 결과:
- 처음 시도한 고전 경로 `/download/attachments/{pageId}/{filename}`는 이 Confluence Cloud 인스턴스에서 502로 실패했다.
- 실제로는 `GET /api/v2/pages/{id}/attachments`로 첨부 목록을 조회해 파일명으로 찾은 뒤, 그 항목의 `downloadLink`(`/rest/api/content/{pageId}/child/attachment/{attachmentId}/download` 형태)를 그대로 써야 했다.
- 이 때문에 이미지 하나당 업스트림 호출이 2번(목록 조회 + 다운로드)이다. 트래픽이 늘면 캐싱이나 첨부 id를 미리 알아두는 최적화가 필요할 수 있다 — 지금은 정확성 우선으로 남겨둠(아래 Next Steps).

## 검증

- `tsc`/`eslint`/`npm run build` 통과.
- converter.ts를 직접 호출하는 단위 확인으로 이미지·코드 하이라이팅 HTML 출력 확인.
- 실제 Confluence 첨부 4개를 `curl`로 직접 호출해 전부 200 확인.
- 브라우저 화면 확인은 dev 서버를 다른 세션과 공유하는 바람에 완전히 깨끗하게는 못 했다 — 상세는 [test-result.md](test-result.md).

## Next Steps (이번 범위 밖, 제안만)

- 첨부 조회 2회 왕복을 줄이기 위한 캐싱(예: 페이지별 첨부 목록을 ISR 캐시와 함께 재사용).
- shiki 하이라이팅이 실제 code 매크로 문서에서 육안으로 잘 보이는지, 별도 dev 서버 단독 환경에서 한 번 더 확인.
- Phase 2(pending): 펼치기(expand) 매크로 → `<details>`, 콜아웃 4종 색상 구분 — spec.md/plan.md에 계획만 남겨두고 이번 커밋에는 포함하지 않았다(범위 유지).
