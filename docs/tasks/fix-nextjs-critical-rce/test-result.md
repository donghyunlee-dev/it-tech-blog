# test-result — Next.js Critical 취약점 해소

| 항목 | 명령/방법 | 결과 |
|---|---|---|
| 취약점 확인(수정 전) | `npm audit` | `next` Critical(16.0.0~16.3.2, 수정판 16.3.5), `sharp` High(next의 하위 의존성), `js-yaml` High(eslint 하위 의존성, 수정판 없음으로 표시) |
| 업그레이드 | `npm install next@16.3.5 eslint-config-next@16.3.5` | 정상 설치 |
| 취약점 확인(1차 수정 후) | `npm audit` | `next`/`sharp` 해소, `js-yaml`만 남고 이번엔 "fix available"로 표시됨(의존성 트리 변경으로 패치 버전 등장) |
| 부가 수정 | `npm audit fix` | `js-yaml` 4.3.1 → 4.3.2 |
| 최종 확인 | `npm audit` | **0 vulnerabilities** |
| Lint | `npm run lint` | 통과 |
| 빌드 | `rm -rf .next && npm run build` | 통과, `Next.js 16.3.5`로 정상 빌드 |
| 회귀 확인 | 브라우저로 홈 화면 확인 | 실 게시글 3건 정상 노출(제목/요약/날짜), 콘솔 에러 없음, 시각적 회귀 없음 |
