# 📧 메일 연동 가이드 (AX Auth 메일 발송)

> 출처: [https://ax-auth.s-food.ai/demo/mail-guide](https://ax-auth.s-food.ai/demo/mail-guide) (사내 AX팀 제공 데모 가이드, 2026-08-18 확인)
> 본 프로젝트에서는 **댓글 알림 메일 발송** 용도로 활용할 예정이다.

## 개요

AX Auth 메일 발송 기능은 [login-integration-guide.md](login-integration-guide.md)의 로그인 절차로 얻은 `login_token`을 이용해, 로그인한 사용자 명의로 메일을 대신 발송하는 기능이다. 발신자는 항상 로그인한 계정으로 고정되며, 고정된 서비스 계정으로 발송하는 별도 기능은 없다.

- 관련 문서: [login-integration-guide.md](login-integration-guide.md), [prd.md](prd.md)

## 사전 준비 — MAIL scope 부여 요청

- 메일 발송 기능을 사용하려면 [login-integration-guide.md](login-integration-guide.md)의 절차로 `clientId`/`clientSecret`을 먼저 발급받아야 한다.
- 등록된 client에는 AX팀이 **MAIL scope**를 추가로 부여해야 메일 발송이 가능하다.
- MAIL scope 부여는 아직 관리자 API가 없어 AX팀에 직접 요청해야 한다.

## 로그인 시 달라지는 점

client에 MAIL scope가 있으면, 로그인(`GET /auth/login/{clientId}`) 시 AX Auth가 Microsoft 인가 요청에 `Mail.Send` 위임 스코프를 자동으로 추가한다. 사용자는 기존 로그인 화면에서 메일 발송 권한 동의를 한 번 더 확인하게 된다. 로그인 호출 방식(팝업/리다이렉트) 자체는 바뀌지 않으며, client가 별도로 요청 파라미터를 바꿀 필요는 없다.

## 메일 발송 요청

로그인 성공 시 받은 `login_token`으로 아래 엔드포인트를 호출한다. 이 API는 `clientSecret`이 필요한 **서버 간 호출 전용**이며, 브라우저에서 직접 호출해서는 안 된다.

```http
POST https://ax-auth.s-food.ai/mail/send
Content-Type: application/json

{
  "clientId": "등록한-clientId",
  "clientSecret": "발급받은-시크릿",
  "loginToken": "콜백에서-받은-토큰",
  "recipients": ["someone@s-food.com"],
  "cc": ["cc-someone@s-food.com"],
  "bcc": ["bcc-someone@s-food.com"],
  "subject": "메일 제목",
  "body": "메일 본문",
  "attachments": [
    { "fileName": "invoice.pdf", "contentType": "application/pdf", "contentBase64": "..." }
  ]
}
```

### 요청 필드

| 필드 | 필수 여부 | 설명 |
|---|---|---|
| `clientId` / `clientSecret` | 필수 | 발급받은 클라이언트 인증 정보 |
| `loginToken` | 필수 | 로그인 시 발급받은 토큰 |
| `recipients` | 필수(최소 1개) | 수신자 목록 |
| `cc` / `bcc` | 선택 | 참조/숨은참조 목록 |
| `subject` / `body` | 필수 | 메일 제목/본문 |
| `attachments` | 선택 | 최대 5개, 원본 파일 크기 합 4MB까지 |

## 응답 형식

응답은 항상 HTTP 200이며, `success` 필드로 성공/실패를 구분한다.

```json
{ "success": true }
```

```json
{ "success": false, "reason": "MAIL_TOKEN_ALREADY_USED" }
```

## 에러 코드

| 코드(`reason`) | 의미 |
|---|---|
| `INVALID_REQUEST` | 필수 값(`recipients`/`subject`/`body`/`loginToken`) 누락 |
| `MAIL_SCOPE_NOT_GRANTED` | 이 client에 MAIL scope가 없음 |
| `TOKEN_EXPIRED` | `login_token` 만료(발급 후 180초 초과) |
| `MAIL_TOKEN_NOT_AVAILABLE` | 로그인 시 MAIL scope가 없어 메일 발송 권한이 확보되지 않음 |
| `MAIL_TOKEN_ALREADY_USED` | 이 `login_token`으로 메일 발송을 이미 1회 사용함 |
| `MAIL_SEND_FAILED` | Microsoft Graph 발송 자체가 실패 |
| `ATTACHMENT_COUNT_EXCEEDED` | 첨부파일이 5개를 초과함 |
| `ATTACHMENT_TOO_LARGE` | 첨부파일 원본 크기 합이 4MB를 초과함 |

## 중요한 제약 사항

- `login_token`은 세션 확립(`/auth/token/verify`)과 메일 발송(`/mail/send`)에 **각각 1회씩만** 사용할 수 있다 — 서로 독립적으로 소비된다.
- 메일 발송은 로그인 후 **180초 이내**에 완료해야 한다.
- 발신자는 **항상 로그인한 사용자 계정**이며, 고정된 서비스 계정으로 발송하는 기능은 없다.
- 모든 발송 시도(성공/실패)는 서버 쪽 `mail_send_log`에 기록된다.

## SFOOD IT Tech Blog 적용 시 참고 사항 (댓글 알림)

본 프로젝트는 이 기능을 **댓글 알림 메일 발송**(문서에 새 댓글이 달렸을 때 작성자에게 알림) 용도로 사용한다. 확정된 설계는 다음과 같다.

- **발신자**: 댓글을 작성한, 그 순간 로그인되어 있는 MS 로그인 사용자 계정.
- **수신자**: 댓글이 달린 문서(블로그 글)를 작성한 사람의 이메일.
- **트리거 시점**: 댓글 생성 처리 흐름 안에서, 댓글 작성자의 로그인 세션이 보유한 `login_token`으로 즉시 `/mail/send`를 호출한다. `login_token`은 발급 후 180초 이내·1회성이므로 지연 발송이나 배치 발송으로는 사용할 수 없고, 댓글 저장과 같은 요청 처리 흐름 내에서 바로 소비해야 한다.
- **적용 범위**: 발신자가 항상 로그인 계정으로 고정되고 고정 서비스 계정 발송은 지원되지 않으므로, 이 알림은 **MS 로그인 사용자 댓글에만 적용**한다. 외부(비로그인) 사용자 댓글은 AX Auth 로그인 세션이 없어 이 방식으로 발송할 수 없으므로 알림 대상에서 제외한다.
- 관련 내용은 [prd.md](prd.md)의 "댓글 알림 메일 발송" 기능 정의와 [architecture.md](architecture.md)의 알림 및 자동화 항목에 반영되어 있다.
