const MACRO_REGEX =
  /<ac:structured-macro ac:name="(code|info|note|warning|tip)"[^>]*>([\s\S]*?)<\/ac:structured-macro>/g;

const PANEL_LABEL: Record<string, string> = {
  info: "안내",
  note: "참고",
  warning: "주의",
  tip: "팁",
};

function extractRichTextBody(macroBody: string): string {
  const match = macroBody.match(
    /<ac:rich-text-body>([\s\S]*?)<\/ac:rich-text-body>/
  );
  return match ? match[1] : "";
}

function extractCodeBody(macroBody: string): string {
  const match = macroBody.match(
    /<ac:plain-text-body>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/ac:plain-text-body>/
  );
  return match ? match[1] : "";
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function convertMacros(storageHtml: string): string {
  return storageHtml.replace(MACRO_REGEX, (_match, name: string, body: string) => {
    if (name === "code") {
      return `<pre class="viewer-code"><code>${escapeHtml(extractCodeBody(body))}</code></pre>`;
    }
    return `<div class="viewer-panel viewer-panel-${name}"><strong>${PANEL_LABEL[name]}</strong>${extractRichTextBody(body)}</div>`;
  });
}

function convertTables(html: string): string {
  return html.replace(/<table(?![^>]*class=)/g, '<table class="viewer-table"');
}

/** 위에서 매핑하지 못한 ac:/ri: 네임스페이스 태그를 제거하되, 내부 리치 텍스트는 유지한다. */
function stripUnmappedMacros(html: string): string {
  return html
    .replace(/<ac:rich-text-body>/g, "")
    .replace(/<\/ac:rich-text-body>/g, "")
    .replace(/<ac:[^>]*>/g, "")
    .replace(/<\/ac:[^>]*>/g, "")
    .replace(/<ri:[^/]*\/>/g, "")
    .replace(/<ri:[^>]*>/g, "")
    .replace(/<\/ri:[^>]*>/g, "");
}

/**
 * 최소한의 방어적 정제(완전한 HTML sanitizer는 아님).
 * script 태그, 인라인 이벤트 핸들러, javascript: 스킴만 제거한다.
 * 필요 시 별도 sanitizer 라이브러리 도입을 검토해야 한다(docs/tasks/phase-3/spec.md 참고).
 */
function sanitize(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

/** Confluence storage format(XHTML)을 Viewer용 웹 HTML로 변환한다(prd.md "Confluence 컴포넌트 컨버터" 기능). */
export function convertStorageToHtml(storageHtml: string): string {
  const withMacros = convertMacros(storageHtml);
  const withTables = convertTables(withMacros);
  const withoutUnmapped = stripUnmappedMacros(withTables);
  return sanitize(withoutUnmapped);
}
