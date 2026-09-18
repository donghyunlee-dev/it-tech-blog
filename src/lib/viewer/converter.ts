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

/** 목차(TOC) 앵커 링크에 쓸 id를 헤딩 텍스트에서 만든다. 한글은 그대로 두고 공백만 하이픈으로 바꾼다. */
function slugify(text: string): string {
  return (
    text
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\p{L}\p{N}-]/gu, "") || "section"
  );
}

/** h2/h3에 슬러그 id를 부여한다(같은 텍스트가 여러 번 나오면 뒤에 순번을 붙여 구분). */
function injectHeadingIds(html: string): string {
  const seen = new Map<string, number>();
  return html.replace(/<(h2|h3)>([\s\S]*?)<\/\1>/g, (match, tag: string, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, "").trim();
    if (!text) return match;

    const base = slugify(text);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    const id = count > 0 ? `${base}-${count + 1}` : base;

    return `<${tag} id="${id}">${inner}</${tag}>`;
  });
}

export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

/** id가 부여된 h2/h3를 순서대로 뽑아 목차 데이터를 만든다. 반드시 convertStorageToHtml이 반환한 html에 대해서만 호출한다. */
export function extractHeadings(html: string): TocHeading[] {
  const headings: TocHeading[] = [];
  const regex = /<(h2|h3) id="([^"]+)">([\s\S]*?)<\/\1>/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html))) {
    const [, tag, id, inner] = match;
    const text = inner.replace(/<[^>]+>/g, "").trim();
    if (!text) continue;
    headings.push({ id, text, level: tag === "h2" ? 2 : 3 });
  }

  return headings;
}

/** Confluence storage format(XHTML)을 Viewer용 웹 HTML로 변환한다(prd.md "Confluence 컴포넌트 컨버터" 기능). */
export function convertStorageToHtml(storageHtml: string): string {
  const withMacros = convertMacros(storageHtml);
  const withTables = convertTables(withMacros);
  const withoutUnmapped = stripUnmappedMacros(withTables);
  const withHeadingIds = injectHeadingIds(withoutUnmapped);
  return sanitize(withHeadingIds);
}
