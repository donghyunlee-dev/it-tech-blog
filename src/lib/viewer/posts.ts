import {
  ConfluencePage,
  getConfiguredSpace,
  getPage,
  getPageProperty,
  listAllSpacePages,
} from "@/lib/confluence/client";
import type { PublishMetadata } from "@/lib/viewer/publish-metadata";
import { NotFoundError } from "@/lib/errors";
import { getSiteBaseUrl } from "@/lib/site";
import { convertStorageToHtml } from "./converter";

const PUBLISH_PROPERTY_KEY = "publishMetadata";
const RELATED_POSTS_LIMIT = 3;

export interface PublishedPostSummary {
  pageId: string;
  slug: string;
  title: string;
  publishedAt: string;
}

export interface PublishedPostDetail extends PublishedPostSummary {
  html: string;
  canonicalUrl: string;
  metaDescription: string;
  relatedPosts: Array<{ slug: string; title: string }>;
}

interface PublishedEntry {
  page: ConfluencePage;
  metadata: PublishMetadata;
}

/** Space의 전체 페이지를 순회해 게시 상태(publishMetadata.isPublished)인 것만 최신순으로 모은다. */
async function listPublishedEntries(): Promise<PublishedEntry[]> {
  const space = await getConfiguredSpace();
  const pages = await listAllSpacePages(space.id);

  const entries: PublishedEntry[] = [];
  for (const page of pages) {
    if (page.status !== "current") continue;

    const property = await getPageProperty<PublishMetadata>(
      page.id,
      PUBLISH_PROPERTY_KEY
    );
    if (property?.value?.isPublished && property.value.slug) {
      entries.push({ page, metadata: property.value });
    }
  }

  entries.sort((a, b) =>
    (b.metadata.publishedAt ?? "").localeCompare(a.metadata.publishedAt ?? "")
  );

  return entries;
}

/** 게시된 문서 목록을 조회한다(Viewer 홈, sitemap, RSS가 공용으로 사용). */
export async function listPublishedPosts(): Promise<PublishedPostSummary[]> {
  const entries = await listPublishedEntries();
  return entries.map(({ page, metadata }) => ({
    pageId: page.id,
    slug: metadata.slug!,
    title: page.title,
    publishedAt: metadata.publishedAt ?? "",
  }));
}

/** slug로 게시된 문서 상세를 조회한다. 게시되지 않았거나 존재하지 않으면 NotFoundError. */
export async function getPublishedPostBySlug(
  slug: string
): Promise<PublishedPostDetail> {
  const entries = await listPublishedEntries();
  const matchIndex = entries.findIndex((entry) => entry.metadata.slug === slug);

  if (matchIndex === -1) {
    throw new NotFoundError("게시된 문서를 찾을 수 없습니다.");
  }

  const { page, metadata } = entries[matchIndex];
  const fullPage = await getPage(page.id);
  const html = convertStorageToHtml(fullPage.body?.storage.value ?? "");

  const relatedPosts = entries
    .filter((_entry, index) => index !== matchIndex)
    .slice(0, RELATED_POSTS_LIMIT)
    .map((entry) => ({ slug: entry.metadata.slug!, title: entry.page.title }));

  return {
    pageId: page.id,
    slug,
    title: page.title,
    publishedAt: metadata.publishedAt ?? "",
    metaDescription: metadata.metaDescription ?? "",
    canonicalUrl: `${getSiteBaseUrl()}/posts/${slug}`,
    html,
    relatedPosts,
  };
}
