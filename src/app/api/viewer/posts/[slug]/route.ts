import { NextResponse } from "next/server";
import { getPublishedPostBySlug } from "@/lib/viewer/posts";
import { toErrorResponse } from "@/lib/api-response";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { slug } = await params;
    const post = await getPublishedPostBySlug(slug);

    return NextResponse.json({
      slug: post.slug,
      title: post.title,
      html: post.html,
      canonicalUrl: post.canonicalUrl,
      metaDescription: post.metaDescription,
      relatedPosts: post.relatedPosts,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
