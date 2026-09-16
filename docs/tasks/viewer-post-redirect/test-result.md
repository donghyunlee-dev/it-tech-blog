# test-result — 게시 주소 변경/삭제 시 리다이렉트 처리

| 항목 | 명령/방법 | 결과 |
|---|---|---|
| Lint | `npm run lint` | 통과 |
| 빌드 | `rm -rf .next && npm run build` | 통과(타입 오류 없음 — `permanentRedirect()` 이후 분기 narrowing 포함) |
| 주소 변경(이동) 시나리오 | 프로덕션 빌드 기동 후, 실제 게시 문서(`test-fa031d2f-e820-4d60-a5b6-a68b5f94b692`)의 UUID 접미사는 그대로 두고 사람이 읽는 부분만 바꾼 가짜 slug(`renamed-fa031d2f-e820-4d60-a5b6-a68b5f94b692`)로 `curl --max-redirs 0` 요청 | `308 Permanent Redirect`, `Location: /posts/test-fa031d2f-e820-4d60-a5b6-a68b5f94b692`(실제 현재 publicSlug) 확인 — **실 데이터를 변경하지 않고** 검증(실제 slug 변경 없이 UUID 조합만으로 재현) |
| 완전 미존재 slug | `curl "/posts/this-does-not-exist-at-all"` | `HTTP 404`, RSC 페이로드에 커스텀 안내 문구("이 문서를 찾을 수 없습니다...")와 "홈으로 돌아가기" 링크 포함 확인(프레임워크 기본 404 아님) |
| 안내 화면 렌더링 | 브라우저(`preview_start` dev 서버)로 동일 URL 접근 후 `get_page_text`/`javascript_tool`로 레이아웃 확인 | 사이트 헤더/푸터 포함해 정상 렌더링, `.empty-state`가 `.wrap` 폭 안에서 `text-align: center`로 정상 중앙 정렬됨(스크린샷 축소 배율 때문에 처음엔 오정렬로 보였으나 `getBoundingClientRect`/`getComputedStyle`로 정상 확인) |
| API 라우트 회귀 | `curl "/api/viewer/posts/this-does-not-exist-at-all"` | 기존과 동일하게 `404`/`{"error":{"code":"NOT_FOUND",...}}` — 이번 변경 범위 밖(페이지 라우팅에만 적용)이라는 spec.md 명시대로 회귀 없음 확인 |

## 커버되지 않은 부분

- Editor에서 실제로 문서 slug를 변경하는 전체 왕복(Editor UI 조작 → Confluence 반영 → Viewer 재조회)은 실 프로덕션 데이터를 건드리는 작업이라 이번 검증에서는 수행하지 않았다. 대신 UUID 조합을 이용해 동일한 코드 경로(정확 일치 실패 → UUID 역조회 성공)를 안전하게 재현했다.
