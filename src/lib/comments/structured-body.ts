export interface StructuredComment {
  authorName: string;
  authorEmail: string;
  body: string;
}

const SEPARATOR = " | ";

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, "");
}

/** architecture.md의 구조화 저장 형식(`이름 | 이메일 | 댓글`)으로 Confluence storage format 문단을 만든다. */
export function formatStructuredBody(input: StructuredComment): string {
  const line = [input.authorName, input.authorEmail, input.body]
    .map(escapeHtml)
    .join(SEPARATOR);
  return `<p>${line}</p>`;
}

/**
 * 저장된 storage format 문단을 다시 `{authorName, authorEmail, body}`로 분리한다.
 * 댓글 본문에 " | "가 포함될 수 있으므로 앞의 두 구분자까지만 분리하고 나머지는 모두 본문으로 취급한다.
 * 형식이 예상과 다르면(파싱 실패) null을 반환한다.
 */
export function parseStructuredBody(storageValue: string): StructuredComment | null {
  const text = stripHtml(storageValue).trim();
  const firstSep = text.indexOf(SEPARATOR);
  if (firstSep === -1) return null;

  const secondSep = text.indexOf(SEPARATOR, firstSep + SEPARATOR.length);
  if (secondSep === -1) return null;

  const authorName = text.slice(0, firstSep).trim();
  const authorEmail = text.slice(firstSep + SEPARATOR.length, secondSep).trim();
  const body = text.slice(secondSep + SEPARATOR.length).trim();

  if (!authorName || !authorEmail || !body) return null;

  return { authorName, authorEmail, body };
}
