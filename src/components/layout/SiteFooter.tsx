import Link from "next/link";
import { RELATED_SITES } from "@/lib/viewer/related-sites";

/**
 * 목업의 "구독 밴드"는 이메일 구독 입력 폼이었지만, 이 서비스에는 이메일 구독 백엔드가
 * 없다(prd.md에도 없는 기능). 동작하지 않는 폼을 보여주는 대신, 실제로 존재하는
 * RSS(/rss.xml)로 안내해 "동작하는 것처럼 보이지만 아무 일도 하지 않는" 요소를 피한다.
 */
export function SiteFooter() {
  const visibleRelatedSites = RELATED_SITES.filter((site) => site.url);

  return (
    <>
      <div className="subscribe-band">
        <h3>새 글 소식을 받아보세요</h3>
        <p>RSS로 구독하면 새 글이 올라올 때마다 리더에서 바로 확인할 수 있습니다.</p>
        <Link href="/rss.xml" className="btn-primary" style={{ textDecoration: "none" }}>
          RSS 구독하기
        </Link>
      </div>

      <footer className="site-footer">
        <div className="wrap">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="wordmark-mini">S-FOOD TECH</div>
              <p>에쓰푸드 IT팀·AX팀이 현장에서 겪은 기술 이야기를 기록하고 나눕니다.</p>
            </div>
            <div className="footer-col">
              <h4>바로가기</h4>
              <Link href="/">전체 글</Link>
            </div>
            <div className="footer-col">
              <h4>연결</h4>
              <Link href="/rss.xml">RSS 구독</Link>
              {visibleRelatedSites.map((site) => (
                <a key={site.name} href={site.url}>
                  {site.name}
                </a>
              ))}
            </div>
          </div>
          <div className="footer-bottom">
            © {new Date().getFullYear()} S-FOOD. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
}
