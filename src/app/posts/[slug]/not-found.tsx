import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

/**
 * `/posts/[slug]`에서 `notFound()`가 호출되면(존재하지 않거나 삭제·게시 해제된 문서) 뜨는
 * 안내 화면. 프레임워크 기본 404 대신 사이트 레이아웃 안에서 홈으로 돌아갈 수 있게 한다
 * (prd.md/architecture.md의 "삭제 시 적절한 페이지로 연결" 요구사항).
 */
export default function PostNotFound() {
  return (
    <div className="wrap">
      <SiteHeader variant="detail" />
      <div className="empty-state">
        <p>이 문서를 찾을 수 없습니다. 삭제되었거나 더 이상 게시되지 않는 문서일 수 있습니다.</p>
        <p style={{ marginTop: 12 }}>
          <Link href="/">홈으로 돌아가기</Link>
        </p>
      </div>
      <SiteFooter />
    </div>
  );
}
