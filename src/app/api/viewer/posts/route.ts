import { NextResponse } from "next/server";
import { listPublishedPosts } from "@/lib/viewer/posts";
import { toErrorResponse } from "@/lib/api-response";

export async function GET() {
  try {
    const posts = await listPublishedPosts();
    return NextResponse.json({
      posts: posts.map((post) => ({
        slug: post.slug,
        title: post.title,
        publishedAt: post.publishedAt,
      })),
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
