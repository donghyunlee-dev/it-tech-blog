import { fetchConfluenceAttachment } from "@/lib/confluence/client";

interface RouteContext {
  params: Promise<{ pageId: string; filename: string }>;
}

/** 본문 안 첨부 이미지 프록시 — converter.ts가 <img src>를 이 라우트로 가리키게 만든다.
 *  Confluence 첨부 다운로드는 Basic Auth가 필요해 브라우저가 직접 요청할 수 없으므로,
 *  서버가 인증해서 받아온 응답을 그대로 스트리밍한다. */
export async function GET(_request: Request, { params }: RouteContext) {
  const { pageId, filename } = await params;

  let upstream: Response;
  try {
    upstream = await fetchConfluenceAttachment(pageId, decodeURIComponent(filename));
  } catch {
    return new Response(null, { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return new Response(null, { status: upstream.status === 404 ? 404 : 502 });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
