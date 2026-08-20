/** Viewer 공개 서비스의 절대 URL(canonical URL·sitemap.xml·rss.xml·댓글 알림 메일 링크 생성용). */
export function getSiteBaseUrl(): string {
  return process.env.SITE_BASE_URL || "http://localhost:3000";
}
