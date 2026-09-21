# test-result — Phase 1 (이미지 복구 + 코드 구문 강조)

## 자동 검증

- `npx tsc --noEmit`: 통과
- `npx eslint .`: 통과
- `npm run build`: 통과, `/api/attachments/[pageId]/[filename]`가 라우트 목록에 정상 등록됨

## 단위 확인 (converter.ts, `npx tsx`로 직접 호출)

- 코드 매크로(`ac:name="code"`, `language=java`) → `<pre class="viewer-code shiki">...토큰별 <span style="color:...">...` 확인.
- 첨부 이미지 매크로(`ac:image` + `ri:attachment ri:filename="shot.png"`, `ac:alt="설명"`) → `<img src="/api/attachments/{pageId}/shot.png" alt="설명" loading="lazy" />` 확인.
- 외부 URL 이미지(`ac:image` + `ri:url`) → 프록시를 거치지 않고 원본 URL 그대로 `<img src>` 확인.

## 실제 Confluence 연동 확인

- 처음에 `/download/attachments/{pageId}/{filename}`(고전 경로)로 프록시를 구현했더니 **502**가 났다 — 실제 Confluence Cloud 인스턴스에 `GET /api/v2/pages/{id}/attachments`를 직접 호출해 대조한 결과, 이 인스턴스는 그 경로를 지원하지 않고 `downloadLink`가 `/rest/api/content/{pageId}/child/attachment/{attachmentId}/download` 형태였다. `listPageAttachments`로 파일명 매칭 후 `downloadLink`를 그대로 쓰도록 수정했다.
- 수정 후 "컴포넌트 테스트" 문서(`pageId=233439235`)의 첨부 이미지 4개 전부 `curl`로 직접 확인: 전부 `200 image/png`.
  - `image-c3626077-98a4-4929-8609-61ebdc28a495.png`
  - `image-c3626077-98a4-4929-8609-61ebdc28a495-870b575a-109f-43df-b23a-9d505d0bfedd.png`
  - `image-c3626077-98a4-4929-8609-61ebdc28a495-7fef53b2-c0fd-4cb7-90f0-0e3dda6c742e.png`
  - `이동현_핸드폰영수증-ea633e59-31fc-439c-8c8b-e08b36c0cda8.png`(공백·한글 파일명 포함, URL 인코딩 정상 동작 확인)

## 브라우저 확인 — 제약 있음

이 세션의 로컬 dev 서버는 다른 세션(동일 저장소, PID 11884)과 공유 상태라 브라우저 네트워크 로그에 수백 건의 중복 요청·`net::ERR_ABORTED`가 섞여 나왔다(다른 세션이 같은 페이지를 계속 새로고침하는 것으로 추정). 그 안에서도:
- 이미지 1개는 `naturalWidth: 859`, `complete: true`로 실제 렌더링 확인.
- `.article-body img`의 계산된 스타일 확인: `border-radius: 14px`, `max-width: 100%`, `display: block` — CSS 정상 적용.
- 나머지 3개 이미지는 브라우저 쪽에서 로딩 중 상태로 관찰됐으나, 같은 URL을 `curl`로 직접 재확인하면 전부 200 — 공유 dev 서버의 간섭으로 판단, 실제 프록시/컨버터 로직 문제는 아님.

**후속 확인 권장**: 이 저장소를 단독으로 쓸 수 있는 환경(다른 세션과 겹치지 않는 dev 서버)에서 실제 화면을 한 번 더 육안으로 확인할 것.

## 확인하지 못한 것 (Out of Scope 재확인)

- shiki 실제 하이라이팅이 적용된 화면 모습(라이브 문서 중 code *매크로*를 쓴 것을 못 찾음 — "컴포넌트 테스트" 문서의 코드 블록은 전부 Editor 네이티브 `<pre><code>`라 매크로 경로를 안 탐, 의도된 동작). 별도 문서로 code 매크로를 게시해 육안 확인 필요.
