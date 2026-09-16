import { requireEnv } from "@/lib/env";

function getConfluenceConfig() {
  return {
    baseUrl: requireEnv("CONFLUENCE_BASE_URL"),
    email: requireEnv("CONFLUENCE_EMAIL"),
    apiToken: requireEnv("CONFLUENCE_API_TOKEN"),
  };
}

function buildAuthHeader(email: string, apiToken: string) {
  return `Basic ${Buffer.from(`${email}:${apiToken}`).toString("base64")}`;
}

/** Confluence API 호출 실패를 상태 코드와 함께 전달하는 오류. 도메인 계층이 404/409 등을 구분하는 데 사용한다. */
export class ConfluenceApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ConfluenceApiError";
    this.status = status;
  }
}

async function confluenceRequest<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const { baseUrl, email, apiToken } = getConfluenceConfig();

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: buildAuthHeader(email, apiToken),
      Accept: "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new ConfluenceApiError(
      response.status,
      `Confluence API 호출 실패: ${response.status} ${response.statusText}${body ? ` - ${body}` : ""}`
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function getCurrentConfluenceUser() {
  return confluenceRequest("/rest/api/user/current");
}

// ── Space ──────────────────────────────────────────────

export interface ConfluenceSpace {
  id: string;
  key: string;
  homepageId: string | null;
}

export async function getConfiguredSpace(): Promise<ConfluenceSpace> {
  const spaceKey = requireEnv("CONFLUENCE_SPACE_KEY");
  const result = await confluenceRequest<{
    results: Array<{ id: string; key: string; homepageId: string | null }>;
  }>(`/api/v2/spaces?keys=${encodeURIComponent(spaceKey)}`);

  const space = result.results[0];
  if (!space) {
    throw new Error(`Confluence Space를 찾을 수 없습니다: ${spaceKey}`);
  }

  return space;
}

// ── Pages (읽기 전용 — Viewer는 Confluence 문서를 쓰지 않는다) ──

export interface ConfluencePage {
  id: string;
  status: string;
  title: string;
  spaceId: string;
  parentId: string | null;
  version: { number: number; createdAt: string };
  body?: { storage: { value: string; representation: "storage" } };
}

export async function getPage(pageId: string): Promise<ConfluencePage> {
  return confluenceRequest<ConfluencePage>(
    `/api/v2/pages/${pageId}?body-format=storage`
  );
}

// ── Content Properties (읽기 전용) ────────────────────────

export interface ConfluencePageProperty<T = unknown> {
  id: string;
  key: string;
  value: T;
  version: { number: number };
}

export async function getPageProperty<T = unknown>(
  pageId: string,
  key: string
): Promise<ConfluencePageProperty<T> | null> {
  const result = await confluenceRequest<{
    results: Array<ConfluencePageProperty<T>>;
  }>(`/api/v2/pages/${pageId}/properties?key=${encodeURIComponent(key)}`);
  return result.results[0] ?? null;
}

/** Space에 속한 모든 페이지를 페이지네이션을 따라가며 조회한다(Viewer의 게시 문서 스캔에 사용). */
export async function listAllSpacePages(
  spaceId: string
): Promise<ConfluencePage[]> {
  const pages: ConfluencePage[] = [];
  let cursor: string | null = null;

  do {
    const query: string = cursor
      ? cursor
      : `/api/v2/spaces/${spaceId}/pages?limit=100`;
    const page = await confluenceRequest<{
      results: ConfluencePage[];
      _links: { next?: string };
    }>(query);

    pages.push(...page.results);
    cursor = page._links.next ?? null;
  } while (cursor);

  return pages;
}

// ── Labels (카테고리/태그 — Confluence 네이티브 페이지 레이블) ──

export interface ConfluencePageLabel {
  id: string;
  name: string;
  prefix: string;
}

/** 문서에 붙은 레이블(태그)을 페이지네이션을 따라가며 전부 조회한다. */
export async function listPageLabels(
  pageId: string
): Promise<ConfluencePageLabel[]> {
  const labels: ConfluencePageLabel[] = [];
  let cursor: string | null = null;

  do {
    const query: string = cursor
      ? cursor
      : `/api/v2/pages/${pageId}/labels?limit=100`;
    const page = await confluenceRequest<{
      results: ConfluencePageLabel[];
      _links: { next?: string };
    }>(query);

    labels.push(...page.results);
    cursor = page._links.next ?? null;
  } while (cursor);

  return labels;
}

// ── Footer Comments (댓글 — Viewer가 쓰기를 수행하는 유일한 대상) ──

export interface ConfluenceFooterComment {
  id: string;
  parentCommentId: string | null;
  createdAt: string;
  body?: { storage: { value: string; representation: "storage" } };
}

export async function createFooterComment(input: {
  pageId: string;
  parentCommentId?: string;
  bodyValue: string;
}): Promise<ConfluenceFooterComment> {
  return confluenceRequest<ConfluenceFooterComment>("/api/v2/footer-comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pageId: input.pageId,
      parentCommentId: input.parentCommentId,
      body: { representation: "storage", value: input.bodyValue },
    }),
  });
}

/** 문서에 달린 모든 댓글을 페이지네이션을 따라가며 한 번에 조회한다(계층은 호출부에서 메모리로 구성). */
export async function listFooterComments(
  pageId: string
): Promise<ConfluenceFooterComment[]> {
  const comments: ConfluenceFooterComment[] = [];
  let cursor: string | null = null;

  do {
    const query: string = cursor
      ? cursor
      : `/api/v2/pages/${pageId}/footer-comments?body-format=storage&limit=100`;
    const page = await confluenceRequest<{
      results: ConfluenceFooterComment[];
      _links: { next?: string };
    }>(query);

    comments.push(...page.results);
    cursor = page._links.next ?? null;
  } while (cursor);

  return comments;
}
