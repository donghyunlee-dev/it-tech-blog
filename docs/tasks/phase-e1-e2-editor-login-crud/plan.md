# Plan — Phase E1/E2: Editor AX Auth 로그인 연동 및 문서 CRUD 검증

1. 현재 코드베이스에서 로그인 리다이렉트 흐름(login page → AX Auth → callback → NextAuth)과 문서 CRUD 관련 코드를 확인해 빠진 부분을 식별한다.
2. 삭제(Delete) 기능이 없음을 확인하고, 기존 계층 구조(Confluence 클라이언트 → 도메인 계층 → API 라우트 → UI)를 그대로 따라 최소 구현을 추가한다.
3. `npm run lint` / `npm run build`로 정적 검증한다.
4. 로컬 dev 서버 + Browser 도구로 로그인 리다이렉트 흐름이 실제 등록된 AX Auth clientId로 동작하는지 확인한다(실 자격증명 입력 직전까지만 — 보안 정책).
5. 실 Confluence 자격증명을 이용해, Next.js 앱 바깥에서 documents.ts와 동일한 API 호출 시퀀스를 재현하는 스모크 테스트 스크립트로 생성·조회·수정·충돌감지·삭제·목록제외를 검증한다(스크립트는 스크래치패드에만 두고 저장소에 커밋하지 않는다).
6. Editor 문서 API가 미인증 요청을 401로 거부하는지 curl로 확인한다.
7. 결과를 `docs/tasks/phase-e1-e2-editor-login-crud/`에 기록하고 `docs/product/prd.md`의 관련 체크리스트를 갱신한다.

## 결정 사항

- 삭제는 Confluence v2 API의 기본 동작(휴지통 이동, soft delete)을 그대로 사용한다. 완전 영구 삭제(purge)는 요구사항에 명시되지 않았고, 실수로 삭제한 문서를 복구할 여지를 남기는 것이 더 안전하다고 판단했다.
- 브라우저를 통한 실 로그인 세션 기반 UI 클릭 테스트는 사용자의 MS 계정 자격증명 입력이 필요해 AI가 대신 수행할 수 없다 — 대신 Confluence 연동 자체를 앱 코드와 동일한 호출 시퀀스로 직접 검증해 "삭제 기능이 실제로 정확히 동작하는지"를 확인했다.
