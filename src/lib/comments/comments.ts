import {
  ConfluenceApiError,
  createFooterComment,
  getPage,
  getPageProperty,
  listFooterComments,
} from "@/lib/confluence/client";
import type { PublishMetadata } from "@/lib/viewer/publish-metadata";
import { VIEWER_ID, type SourceDocument } from "@/lib/viewer/posts";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { getSiteBaseUrl } from "@/lib/site";
import { formatStructuredBody, parseStructuredBody } from "./structured-body";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface CommentNode {
  commentId: string;
  authorName: string;
  body: string;
  createdAt: string;
  replies: CommentNode[];
}

interface ParsedRecord {
  id: string;
  parentCommentId: string | null;
  createdAt: string;
  authorName: string;
  body: string;
}

/**
 * 문서의 전체 댓글을 한 번에 조회한 뒤 메모리에서 계층을 구성한다
 * (prd.md "대댓글 및 댓글 계층 조회" + "댓글 조회 성능 최적화"를 함께 충족 — docs/tasks/phase-4/spec.md 참고).
 * 부모 댓글을 찾을 수 없는 레코드(삭제되었거나 구조화 형식이 깨진 경우)는 최상위로 끌어올려 표시한다.
 */
export async function listComments(pageId: string): Promise<CommentNode[]> {
  const rawComments = await listFooterComments(pageId);

  const records: ParsedRecord[] = [];
  for (const comment of rawComments) {
    const parsed = parseStructuredBody(comment.body?.storage.value ?? "");
    if (!parsed) {
      console.error(`[comments] 구조화 형식이 아닌 댓글을 건너뜁니다: ${comment.id}`);
      continue;
    }
    records.push({
      id: comment.id,
      parentCommentId: comment.parentCommentId,
      createdAt: comment.createdAt,
      authorName: parsed.authorName,
      body: parsed.body,
    });
  }

  const knownIds = new Set(records.map((record) => record.id));
  const childrenByParent = new Map<string | null, ParsedRecord[]>();

  for (const record of records) {
    const effectiveParentId =
      record.parentCommentId && knownIds.has(record.parentCommentId)
        ? record.parentCommentId
        : null;
    const siblings = childrenByParent.get(effectiveParentId) ?? [];
    siblings.push(record);
    childrenByParent.set(effectiveParentId, siblings);
  }

  for (const siblings of childrenByParent.values()) {
    siblings.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  function buildTree(parentId: string | null): CommentNode[] {
    const children = childrenByParent.get(parentId) ?? [];
    return children.map((record) => ({
      commentId: record.id,
      authorName: record.authorName,
      body: record.body,
      createdAt: record.createdAt,
      replies: buildTree(record.id),
    }));
  }

  return buildTree(null);
}

export interface CreateCommentInput {
  pageId: string;
  parentCommentId?: string;
  body: string;
  /** 세션이 있으면 MS 로그인 사용자로, 없으면 authorName/authorEmail이 필수인 외부 사용자로 처리한다. */
  session: { email: string } | null;
  authorName?: string;
  authorEmail?: string;
}

export interface CreateCommentResult {
  commentId: string;
  createdAt: string;
  authorType: "ms_user" | "external";
  authorName: string;
}

/** 댓글(또는 대댓글)을 생성한다. 신원은 세션이 있으면 세션 정보를 우선하고, 클라이언트가 보낸 값은 무시한다. */
export async function createComment(
  input: CreateCommentInput
): Promise<CreateCommentResult> {
  const trimmedBody = input.body.trim();
  if (!trimmedBody) {
    throw new ValidationError("댓글 본문은 필수입니다.");
  }

  let authorType: "ms_user" | "external";
  let authorName: string;
  let authorEmail: string;

  if (input.session) {
    authorType = "ms_user";
    authorEmail = input.session.email;
    // 신원 확인 화면에서 사용자가 이름을 고칠 수 있도록 허용한다(design-direction.md 2026-09-14 결정).
    // 이메일은 위조 방지를 위해 항상 세션 값을 사용하고 클라이언트 입력은 무시한다.
    const editedName = (input.authorName ?? "").trim();
    authorName = editedName || input.session.email.split("@")[0];
  } else {
    authorType = "external";
    authorName = (input.authorName ?? "").trim();
    authorEmail = (input.authorEmail ?? "").trim();

    if (!authorName || !authorEmail) {
      throw new ValidationError("이름과 이메일은 필수입니다.");
    }
    if (!EMAIL_REGEX.test(authorEmail)) {
      throw new ValidationError("이메일 형식이 올바르지 않습니다.");
    }
  }

  const bodyValue = formatStructuredBody({
    authorName,
    authorEmail,
    body: trimmedBody,
  });

  let created;
  try {
    created = await createFooterComment({
      pageId: input.pageId,
      parentCommentId: input.parentCommentId,
      bodyValue,
    });
  } catch (error) {
    if (error instanceof ConfluenceApiError && error.status === 404) {
      throw new NotFoundError("문서 또는 부모 댓글을 찾을 수 없습니다.");
    }
    throw error;
  }

  return {
    commentId: created.id,
    createdAt: created.createdAt,
    authorType,
    authorName,
  };
}

export interface DocumentNotificationMeta {
  title: string;
  url: string;
  authorEmail: string | null;
}

/**
 * 댓글 알림 메일 발송에 필요한 문서 메타(제목·공개 URL·작성자 이메일)를 조회한다.
 * 조회 실패는 null을 반환해 알림을 조용히 건너뛸 수 있게 한다(댓글 생성 자체는 이미 완료된 뒤 호출됨).
 */
export async function getDocumentNotificationMeta(
  pageId: string
): Promise<DocumentNotificationMeta | null> {
  try {
    const [sourceDoc, authorMeta, publishMetadata] = await Promise.all([
      getPageProperty<SourceDocument>(pageId, "sourceDocument"),
      getPageProperty<{ actualAuthorEmail?: string }>(pageId, "authorMeta"),
      getPageProperty<PublishMetadata>(pageId, "publishMetadata"),
    ]);

    const slug = publishMetadata?.value?.viewers?.[VIEWER_ID]?.publicSlug;
    return {
      title: sourceDoc?.value?.title ?? (await getPage(pageId)).title,
      url: slug ? `${getSiteBaseUrl()}/posts/${slug}` : getSiteBaseUrl(),
      authorEmail: authorMeta?.value?.actualAuthorEmail ?? null,
    };
  } catch {
    return null;
  }
}
