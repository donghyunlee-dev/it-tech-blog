const MACRO_REGEX =
  /<ac:structured-macro ac:name="(code|info|note|warning|tip|expand)"[^>]*>([\s\S]*?)<\/ac:structured-macro>/g;

const PANEL_LABEL: Record<string, string> = {
  info: "안내",
  note: "참고",
  warning: "주의",
  tip: "팁",
};

/** Confluence 코드 매크로 language 파라미터 → shiki 번들 언어 id. 매핑에 없으면 강조 없이 escape만 한다. */
const SHIKI_LANGUAGE_ALIASES: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  sh: "bash",
  shell: "bash",
  yml: "yaml",
  none: "text",
  plain: "text",
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

function extractMacroParam(macroBody: string, name: string): string | null {
  const match = macroBody.match(
    new RegExp(`<ac:parameter ac:name="${name}">([\\s\\S]*?)</ac:parameter>`)
  );
  return match ? match[1].trim() : null;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** shiki가 생성하는 <pre class="shiki" style="background-color:...;color:...">에서 자체 배경/글자색
 *  스타일만 걷어낸다 — 배경·패딩·라운드는 계속 .article-body pre/.viewer-code(globals.css)가
 *  맡고, shiki는 토큰별 <span style="color:...">만 담당하게 해 기존 코드 블록 디자인과 충돌하지
 *  않게 한다. language는 wrapCodeBlocks가 코드 창 헤더의 언어 라벨을 만드는 데 쓴다. */
function stripShikiOwnStyle(shikiHtml: string, language: string): string {
  // shiki는 테마 이름까지 클래스에 붙여 class="shiki github-dark"처럼 내보낸다 — 정확히
  // "shiki"만 매칭하면 놓친다.
  return shikiHtml.replace(
    /<pre class="shiki[^"]*"[^>]*>/,
    `<pre class="viewer-code shiki" data-lang="${escapeHtml(language)}">`
  );
}

async function highlightCode(code: string, language: string | null): Promise<string> {
  const lang = language ? SHIKI_LANGUAGE_ALIASES[language] ?? language : "text";

  try {
    const { codeToHtml } = await import("shiki");
    // 코드 블록을 콜아웃/본문과 뚜렷이 구분되는 다크 톤 "코드 창"으로 디자인한다(2026-09-21,
    // 기술 블로그에 안 맞는다는 피드백) — github-dark 토큰 색이 어두운 배경 기준으로 맞춰져
    // 있어, 이 배경(globals.css .article-body pre)도 그와 맞는 어두운 톤으로 바꿔야 한다.
    const html = await codeToHtml(code, { lang, theme: "github-dark" });
    return stripShikiOwnStyle(html, language ?? "");
  } catch {
    // shiki가 모르는 언어이거나 하이라이팅에 실패하면 무강조 코드 블록으로 대체한다(언어 라벨은
    // 그대로 남겨 코드 창 디자인은 유지된다).
    return `<pre class="viewer-code" data-lang="${escapeHtml(language ?? "")}"><code>${escapeHtml(code)}</code></pre>`;
  }
}

/** 매크로 유무·언어 정보 유무와 무관하게 모든 <pre>를 언어 라벨 + 복사 버튼이 있는 "코드 창"
 *  안에 감싼다. Editor 네이티브 <pre><code>(매크로를 거치지 않아 하이라이팅도, data-lang도
 *  없음)도 똑같이 감싸 코드 블록끼리 디자인이 갈리지 않게 한다 — 실제로 "컴포넌트 테스트"
 *  문서의 코드 블록은 전부 이 네이티브 케이스였다. 복사 버튼 클릭은 CodeCopyButtons.tsx(클라
 *  이언트 컴포넌트)가 document 레벨 이벤트 위임으로 처리한다 — .article-body는
 *  dangerouslySetInnerHTML 정적 문자열이라 여기서 React 핸들러를 못 붙인다. */
function wrapCodeBlocks(html: string): string {
  return html.replace(/<pre([^>]*)>([\s\S]*?)<\/pre>/g, (_match, attrs: string, inner: string) => {
    const lang = attrs.match(/data-lang="([^"]*)"/)?.[1]?.trim();
    const label = lang ? lang.toUpperCase() : "CODE";

    return (
      `<div class="code-block">` +
      `<div class="code-block-header">` +
      `<span class="code-block-lang">${label}</span>` +
      `<button type="button" class="code-block-copy" data-code-copy>복사</button>` +
      `</div>` +
      `<pre${attrs}>${inner}</pre>` +
      `</div>`
    );
  });
}

async function convertMacros(storageHtml: string): Promise<string> {
  const matches = [...storageHtml.matchAll(MACRO_REGEX)];
  let result = storageHtml;

  for (const match of matches) {
    const [fullMatch, name, body] = match;

    let replacement: string;
    if (name === "code") {
      const language = extractMacroParam(body, "language");
      replacement = await highlightCode(extractCodeBody(body), language);
    } else if (name === "expand") {
      const title = extractMacroParam(body, "title") ?? "더 보기";
      replacement = `<details class="viewer-expand"><summary>${escapeHtml(title)}</summary>${extractRichTextBody(body)}</details>`;
    } else {
      replacement = `<div class="viewer-panel viewer-panel-${name}"><strong>${PANEL_LABEL[name]}</strong>${extractRichTextBody(body)}</div>`;
    }

    result = result.replace(fullMatch, replacement);
  }

  return result;
}

/** 표를 `.viewer-table-wrap`(overflow-x:auto)으로 감싸 좁은 화면에서 표만 가로 스크롤되게
 *  한다. 이전엔 <table> 자체에 display:block+overflow-x:auto를 직접 줬는데, display:block이
 *  브라우저의 표 자동 폭 분배를 깨버려(display:table이 아니면 열 폭이 내용 크기로만 줄어듦)
 *  내용이 적은 표가 본문 폭을 다 못 채우고 작게 나오는 회귀가 있었다(2026-09-21 발견 — 실측
 *  결과 표 박스 자체는 936px인데 마지막 셀 오른쪽 끝은 237px에서 끝남). 래퍼로 스크롤을
 *  분리하고 <table>은 평범한 display:table로 되돌려 폭 분배를 정상화한다. */
function convertTables(html: string): string {
  return html.replace(/<table(?![^>]*class=)[^>]*>[\s\S]*?<\/table>/g, (match) => {
    const withClass = match.replace(/<table/, '<table class="viewer-table"');
    return `<div class="viewer-table-wrap">${withClass}</div>`;
  });
}

/** Confluence 첨부 이미지(ac:image + ri:attachment)와 외부 URL 이미지(ac:image + ri:url)를 <img>로
 *  바꾼다. 첨부 이미지는 Confluence 다운로드가 인증을 요구해 브라우저가 직접 못 받아오므로,
 *  서버가 인증을 대신 처리하는 프록시 라우트(/api/attachments/[pageId]/[filename])를 가리키게
 *  한다(src/app/api/attachments/[pageId]/[filename]/route.ts 참고). stripUnmappedMacros보다
 *  먼저 실행해야 한다 — 그쪽이 먼저 돌면 ac:image/ri:attachment 태그가 정보 없이 사라진다. */
/** Confluence 에디터의 이미지 "설명"(캡션) 입력이 storage format에는 별도 캡션 요소가 아니라
 *  ac:image의 ac:alt 속성으로 저장된다(실측 확인 — ac:caption 요소는 이 문서에 없었음). alt
 *  속성에만 넣으면 화면(스크린리더 제외)에는 안 보여 "캡션 정보가 있는데 화면에 안 나온다"는
 *  피드백(2026-09-21)이 있었다 — <figure>/<figcaption>으로 화면에도 보이게 하고, alt도 그대로
 *  유지해 접근성은 지킨다. */
function convertImages(html: string, pageId: string): string {
  return html.replace(/<ac:image[^>]*>([\s\S]*?)<\/ac:image>/g, (fullMatch, inner: string) => {
    const attachmentMatch = inner.match(/<ri:attachment ri:filename="([^"]+)"/);
    const urlMatch = inner.match(/<ri:url ri:value="([^"]+)"/);
    const altMatch = fullMatch.match(/<ac:image[^>]*\sac:alt="([^"]*)"/);
    const caption = altMatch ? escapeHtml(altMatch[1]) : "";

    let src: string | null = null;
    if (attachmentMatch) {
      src = `/api/attachments/${pageId}/${encodeURIComponent(attachmentMatch[1])}`;
    } else if (urlMatch) {
      src = escapeHtml(urlMatch[1]);
    }

    // 첨부/외부 URL 어느 쪽도 못 찾으면(예: 삭제된 첨부) 이미지 자체를 생략한다.
    if (!src) return "";

    const img = `<img src="${src}" alt="${caption}" loading="lazy" />`;
    if (!caption) return img;

    return `<figure class="viewer-figure">${img}<figcaption>${caption}</figcaption></figure>`;
  });
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

/** Confluence storage format(XHTML)을 Viewer용 웹 HTML로 변환한다(prd.md "Confluence 컴포넌트 컨버터" 기능).
 *  코드 매크로 하이라이팅(shiki)이 비동기라 전체가 async다. pageId는 첨부 이미지 프록시 URL을
 *  만드는 데 쓴다(convertImages 참고). */
export async function convertStorageToHtml(
  storageHtml: string,
  pageId: string
): Promise<string> {
  const withMacros = await convertMacros(storageHtml);
  const withImages = convertImages(withMacros, pageId);
  const withTables = convertTables(withImages);
  const withoutUnmapped = stripUnmappedMacros(withTables);
  const withHeadingIds = injectHeadingIds(withoutUnmapped);
  const withCodeChrome = wrapCodeBlocks(withHeadingIds);
  return sanitize(withCodeChrome);
}
