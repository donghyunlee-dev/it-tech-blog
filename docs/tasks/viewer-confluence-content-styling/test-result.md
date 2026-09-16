# test-result — Confluence 본문 요소 스타일 복구

## 회귀 확인 (수정 전)

실제 게시 문서(`/posts/instructions-0399ebbc-177a-4124-8c73-fdfe8a03cb71`)에서 `getComputedStyle`로 직접 측정:

| 요소 | 수정 전 | 문제 |
|---|---|---|
| `h2` | `fontSize=16px fontWeight=700` | 본문 문단(16px)과 완전히 동일한 크기 — 제목으로 안 보임 |
| `ul` | `listStyleType=none paddingLeft=0px` | 불릿·들여쓰기 없음 — 그냥 이어붙은 문단처럼 보임 |
| `blockquote` | `paddingLeft=0px borderLeftWidth=0px` | 인용문 표시 전혀 없음 — 본문과 구분 불가 |

원인: 2026-09-15 `@sfood/ui` 도입 시 추가한 Tailwind Preflight(`@tailwind base`)가 브라우저 기본 제목·목록·인용문 스타일을 초기화했는데, `globals.css`에 이 요소들을 위한 대체 스타일이 없었다.

## 실행한 검증 (수정 후)

| 항목 | 명령/방법 | 결과 |
|---|---|---|
| Lint | `npm run lint` | 통과 |
| 빌드 | `rm -rf .next && npm run build` | 통과 |
| `h2` | `getComputedStyle` | `fontSize=24px fontWeight=700` — 본문과 뚜렷이 구분됨 |
| `ul` | `getComputedStyle` | `listStyleType=disc paddingLeft=22px` — 불릿·들여쓰기 복구 |
| `blockquote` | `getComputedStyle` | `borderLeft=2.4px solid`(1px 스케일 보정 전 3px), `paddingLeft=20px`, `color=rgb(84,88,90)`(`--text-secondary`), `margin=28px 0px` |
| 인라인 `code`/블록 `.viewer-code` 충돌 여부 | 코드 리뷰 | `.article-body pre code`로 블록 코드 안의 `code`에는 인라인 스타일이 되돌려지도록 별도 규칙 추가 |
| 스크린샷 | 브라우저 프리뷰 | 소제목이 본문보다 크고 굵게 보임을 육안 확인 |

## AI 슬롭 체크리스트 재점검

이번 회귀는 2026-09-15에 이미 점검했던 "장식용 그라데이션"·"반응 없는 호버"와는 다른 항목이었다 — **"균일한 크기"(uniform sizing)** 항목에 해당한다. 제목·목록·인용문이 전부 본문과 같은 크기로 뭉개져 있던 것을 별도 요소별 크기·강조로 다시 구분해 이 항목도 통과하도록 했다. 그라데이션·호버는 이번 변경으로 건드리지 않았으며 grep으로 재확인한 결과 여전히 없음(그라데이션) / 있음(호버).
