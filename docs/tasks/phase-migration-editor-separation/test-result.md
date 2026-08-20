# Test Result — 이관(마이그레이션): Editor/Viewer 저장소 분리

## 새 저장소(sfood-it-editor)

- `npm install`: 354개 패키지 설치, 취약점 0건.
- `npm run lint`: 통과.
- `npm run build`: 통과. 라우트: `/`, `/login`, `/editor`, `/editor/new`, `/editor/[pageId]`, `/editor/[pageId]/publish`, `/api/auth/[...nextauth]`, `/api/auth/ax-callback`, `/api/editor/documents`(+하위 라우트), `/api/editor/folder`, `/api/health/confluence` — 기대한 Editor 전용 라우트 전부 생성됨.
- 개발 서버(포트 3100)로 `/login` 접속 → "MS 계정으로 로그인" 링크가 실제 `.env`의 AX Auth clientId로 정상 렌더링됨을 확인(redirect_uri는 원본 `.env` 값을 그대로 복사해 `localhost:3000`을 가리키는 상태 — 실제 배포 도메인이 정해지면 재설정 필요, Phase E1 계획과 일치).

## 원본 저장소(Viewer)

- `npm run lint`: 통과.
- `npm run build`: 통과. 라우트: `/`, `/api/auth/[...nextauth]`, `/api/auth/ax-callback`, `/api/comments`, `/api/health/confluence`, `/api/viewer/posts`(+`[slug]`), `/posts/[slug]`, `/robots.txt`, `/rss.xml`, `/sitemap.xml` — Editor 관련 라우트(`/editor*`, `/login`, `/api/editor/*`) 전부 사라짐을 확인.
- 브라우저 스모크 테스트:
  - `GET /` → 200, "아직 게시된 문서가 없습니다" 빈 상태 정상 표시(실 게시 문서가 없는 현재 상태와 일치).
  - `GET /login` → 404("This page could not be found") — Editor 전용 로그인 화면이 이 저장소에서 제거되었음을 확인.

## 발견 및 정정한 문제

- 최초 삭제 시 `src/lib/notifications`(Slack 알림)를 Editor 이관 목록만 보고 함께 지웠으나, Viewer도 이 모듈을 공유해서 쓰고 있어(`api-response.ts`의 502 분기) 빌드 전에 발견해 Editor 저장소에서 복사해 즉시 복원했다.
- `src/lib/editor/*` 삭제 시 첫 build에서 `Module not found: Can't resolve '@/lib/auth-guard'` 오류 발생 — `api-response.ts`가 여전히 `UnauthorizedError`를 그쪽에서 가져오고 있었음을 뒤늦게 확인, `src/lib/errors.ts`에 해당 클래스를 추가해 해결.

## 미검증 항목

- 새 저장소(sfood-it-editor)의 문서 CRUD·이미지 등록·게시 설정 API는 이번에는 재검증하지 않았다(코드가 원본 저장소에서 그대로 복사된 것이고, 원본에서 이미 phase-e1-e2/phase-e3 작업으로 실 Confluence 검증을 마쳤기 때문 — 파일 내용은 100% 동일).
- GitHub 원격 저장소 생성/push는 진행하지 않음(사용자가 별도로 진행).
