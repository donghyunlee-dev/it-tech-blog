import {
  ConfluencePage,
  getConfiguredSpace,
  getPage,
  getPageProperty,
  listAllSpacePages,
} from "@/lib/confluence/client";
import type { PublishMetadata, PublishViewerMetadata } from "@/lib/viewer/publish-metadata";
import { NotFoundError } from "@/lib/errors";
import { getSiteBaseUrl } from "@/lib/site";
import { convertStorageToHtml } from "./converter";

const PUBLISH_PROPERTY_KEY = "publishMetadata";
const SOURCE_DOCUMENT_PROPERTY_KEY = "sourceDocument";
/** 이 서비스(Tech Blog)가 Editor의 게시 대상 목록에서 스스로를 가리키는 viewer id. */
export const VIEWER_ID = "tech-blog";
const RELATED_POSTS_LIMIT = 3;
const READING_CHARS_PER_MINUTE = 500;

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
}

export interface PublishedPostDetail extends PublishedPostSummary {
  html: string;
  canonicalUrl: string;
  readingMinutes: number;
  /** 본문에 실제 이미지가 있을 때만 채워진다(정책: 이미지는 있으면 보너스). */
  heroImageUrl: string | null;
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

    const sourceDocProperty = await getPageProperty<SourceDocument>(
      page.id,
      SOURCE_DOCUMENT_PROPERTY_KEY
    );

    entries.push({
      page,
      viewerMeta,
      publishedAt: publishProperty.value.publishedAt ?? "",
      title: sourceDocProperty?.value?.title ?? page.title,
    });
  }

  entries.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return entries;
}

/** 게시된 문서 목록을 조회한다(Viewer 홈, sitemap, RSS가 공용으로 사용). */
export async function listPublishedPosts(): Promise<PublishedPostSummary[]> {
  const entries = await listPublishedEntries();
  return entries.map(({ page, viewerMeta, publishedAt, title }) => ({
    pageId: page.id,
    slug: viewerMeta.publicSlug,
    title,
    publishedAt,
    metaDescription: viewerMeta.metaDescription ?? "",
  }));
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

  const { page, viewerMeta, publishedAt, title } = entries[matchIndex];
  const fullPage = await getPage(page.id);
  const html = convertStorageToHtml(fullPage.body?.storage.value ?? "");

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
    canonicalUrl: `${getSiteBaseUrl()}/posts/${slug}`,
    html,
    readingMinutes: estimateReadingMinutes(html),
    heroImageUrl: extractFirstImageSrc(html),
    relatedPosts,
  };
}
