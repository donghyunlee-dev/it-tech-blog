import {
  ConfluencePage,
  getConfiguredSpace,
  getPage,
  getPageProperty,
  listAllSpacePages,
  listPageLabels,
} from "@/lib/confluence/client";
import type { PublishMetadata, PublishViewerMetadata } from "@/lib/viewer/publish-metadata";
import { NotFoundError } from "@/lib/errors";
import { getSiteBaseUrl } from "@/lib/site";
import { convertStorageToHtml, extractHeadings, TocHeading } from "./converter";

const PUBLISH_PROPERTY_KEY = "publishMetadata";
const SOURCE_DOCUMENT_PROPERTY_KEY = "sourceDocument";
/** 이 서비스(Tech Blog)가 Editor의 게시 대상 목록에서 스스로를 가리키는 viewer id. */
export const VIEWER_ID = "tech-blog";
const RELATED_POSTS_LIMIT = 3;
const READING_CHARS_PER_MINUTE = 500;
/** 카테고리 체계가 아니라 작성자가 자유롭게 붙인 다중 태그라 순서 보장이 없다 — 키커 자리에
 *  너무 길게 늘어지지 않도록 앞에서부터 최대 3개만 보여준다. */
const MAX_DISPLAYED_TAGS = 3;

/** Editor가 `sourceDocument` content property에 쓰는 값 중 Viewer가 필요로 하는 부분만. */
export interface SourceDocument {
  title: string;
}

export interface PublishedPostSummary {
  pageId: string;
  /** Editor가 계산한 전역 유니크 slug(`publicSlug`) — 공개 경로에 그대로 쓴다. */
  slug: string;
  title: string;
  publishedAt: string;
  metaDescription: string;
  /** Confluence 페이지 레이블(태그). 없으면 빈 배열 — 화면에서 태그 라인 자체를 생략한다. */
  tags: string[];
}

export interface PublishedPostDetail extends PublishedPostSummary {
  html: string;
  canonicalUrl: string;
  readingMinutes: number;
  /** 본문에 실제 이미지가 있을 때만 채워진다(정책: 이미지는 있으면 보너스). */
  heroImageUrl: string | null;
  /** 본문의 h2/h3에서 자동 추출한 목차. 헤딩이 없으면 빈 배열(그 경우 TOC 사이드바 자체를 생략한다). */
  headings: TocHeading[];
  relatedPosts: Array<{ slug: string; title: string }>;
}

/** 공백을 제외한 글자수를 분당 500자로 나눠 예상 읽기 시간을 추정한다(최소 1분). */
function estimateReadingMinutes(html: string): number {
  const text = html.replace(/<[^>]*>/g, "").replace(/\s+/g, "");
  return Math.max(1, Math.round(text.length / READING_CHARS_PER_MINUTE));
}

/** 변환된 본문 HTML에서 첫 번째 이미지 src만 추출한다(히어로 이미지 후보). */
function extractFirstImageSrc(html: string): string | null {
  const match = html.match(/<img[^>]+src="([^"]+)"/);
  return match ? match[1] : null;
}

interface PublishedEntry {
  page: ConfluencePage;
  viewerMeta: PublishViewerMetadata;
  publishedAt: string;
  title: string;
  tags: string[];
}

/**
 * Space의 전체 페이지를 순회해 이 Viewer(`tech-blog`)에 게시된 것만 최신순으로 모은다.
 * Confluence 페이지 자체의 `title`은 충돌 방지를 위해 Editor가 무작위 UUID로 채워두므로
 * (Editor `documents.ts`의 의도적 설계, 표시용이 아님) 표시 제목은 `sourceDocument.title`에서 가져온다.
 */
async function listPublishedEntries(): Promise<PublishedEntry[]> {
  const space = await getConfiguredSpace();
  const pages = await listAllSpacePages(space.id);

  const entries: PublishedEntry[] = [];
  for (const page of pages) {
    if (page.status !== "current") continue;

    const publishProperty = await getPageProperty<PublishMetadata>(
      page.id,
      PUBLISH_PROPERTY_KEY
    );
    const viewerMeta = publishProperty?.value?.viewers?.[VIEWER_ID];
    if (!publishProperty?.value?.isPublished || !viewerMeta?.publicSlug) {
      continue;
    }

    const [sourceDocProperty, labels] = await Promise.all([
      getPageProperty<SourceDocument>(page.id, SOURCE_DOCUMENT_PROPERTY_KEY),
      listPageLabels(page.id),
    ]);

    entries.push({
      page,
      viewerMeta,
      publishedAt: publishProperty.value.publishedAt ?? "",
      title: sourceDocProperty?.value?.title ?? page.title,
      tags: labels
        .filter((label) => label.prefix === "global")
        .map((label) => label.name)
        .slice(0, MAX_DISPLAYED_TAGS),
    });
  }

  entries.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return entries;
}

/** 게시된 문서 목록을 조회한다(Viewer 홈, sitemap, RSS가 공용으로 사용). */
export async function listPublishedPosts(): Promise<PublishedPostSummary[]> {
  const entries = await listPublishedEntries();
  return entries.map(({ page, viewerMeta, publishedAt, title, tags }) => ({
    pageId: page.id,
    slug: viewerMeta.publicSlug,
    title,
    publishedAt,
    metaDescription: viewerMeta.metaDescription ?? "",
    tags,
  }));
}

/** 마지막 `-` 뒤 36자가 UUID 형식이면 그 값을 반환한다(publicSlug의 불변 접미사 — data-spec.md 참고). */
function extractTrailingUuid(slug: string): string | null {
  const UUID_LENGTH = 36;
  const separatorIndex = slug.length - UUID_LENGTH - 1;
  if (separatorIndex < 0 || slug[separatorIndex] !== "-") return null;

  const candidate = slug.slice(separatorIndex + 1);
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(candidate);
  // 페이지 title(page.title)은 항상 소문자 randomUUID() 값이므로(data-spec.md), 대소문자가
  // 섞인 옛 주소도 매칭되도록 반환 전에 정규화한다 — 위 정규식이 대소문자를 가리지 않고
  // "UUID 형태"로 인정한 값을 그대로 돌려주면 호출부의 `===` 비교가 깨진다.
  return isUuid ? candidate.toLowerCase() : null;
}

async function buildPostDetail(
  entries: PublishedEntry[],
  matchIndex: number,
  slug: string
): Promise<PublishedPostDetail> {
  const { page, viewerMeta, publishedAt, title, tags } = entries[matchIndex];
  const fullPage = await getPage(page.id);
  const html = await convertStorageToHtml(fullPage.body?.storage.value ?? "", page.id);

  const relatedPosts = entries
    .filter((_entry, index) => index !== matchIndex)
    .slice(0, RELATED_POSTS_LIMIT)
    .map((entry) => ({ slug: entry.viewerMeta.publicSlug, title: entry.title }));

  return {
    pageId: page.id,
    slug,
    title,
    publishedAt,
    metaDescription: viewerMeta.metaDescription ?? "",
    tags,
    canonicalUrl: `${getSiteBaseUrl()}/posts/${slug}`,
    html,
    readingMinutes: estimateReadingMinutes(html),
    heroImageUrl: extractFirstImageSrc(html),
    headings: extractHeadings(html),
    relatedPosts,
  };
}

/** slug(publicSlug)로 게시된 문서 상세를 조회한다. 게시되지 않았거나 존재하지 않으면 NotFoundError. */
export async function getPublishedPostBySlug(
  slug: string
): Promise<PublishedPostDetail> {
  const entries = await listPublishedEntries();
  const matchIndex = entries.findIndex((entry) => entry.viewerMeta.publicSlug === slug);

  if (matchIndex === -1) {
    throw new NotFoundError("게시된 문서를 찾을 수 없습니다.");
  }

  return buildPostDetail(entries, matchIndex, slug);
}

export type PostRouteResult =
  | { status: "found"; post: PublishedPostDetail }
  | { status: "moved"; currentSlug: string }
  | { status: "not-found" };

/**
 * 게시 문서 상세 페이지(`/posts/[slug]`) 전용 조회. 정확히 일치하는 slug가 없으면, Editor가
 * publicSlug 접미사로 항상 붙이는 페이지 고유 UUID(작성자가 slug를 바꿔도 변하지 않음 —
 * data-spec.md 참고)로 역조회해 "주소만 바뀐 문서"인지 "실제로 없는 문서"인지 구분한다.
 * 바뀐 문서면 현재 slug로 리다이렉트할 수 있도록 `moved`를 반환하고, 그마저 없으면(삭제·게시
 * 해제·애초에 잘못된 주소) `not-found`를 반환한다.
 */
export async function resolvePostRoute(slug: string): Promise<PostRouteResult> {
  const entries = await listPublishedEntries();
  const matchIndex = entries.findIndex((entry) => entry.viewerMeta.publicSlug === slug);

  if (matchIndex !== -1) {
    return { status: "found", post: await buildPostDetail(entries, matchIndex, slug) };
  }

  const uuid = extractTrailingUuid(slug);
  if (uuid) {
    const renamed = entries.find((entry) => entry.page.title === uuid);
    if (renamed) {
      return { status: "moved", currentSlug: renamed.viewerMeta.publicSlug };
    }
  }

  return { status: "not-found" };
}
