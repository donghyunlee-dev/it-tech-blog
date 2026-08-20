export interface RelatedSite {
  name: string;
  url: string;
}

/**
 * requirements.md: "회사 홈페이지와 B2C·B2B 서비스 등 관련 사이트로 이동할 수 있는
 * 연관 사이트 링크를 제공한다." 실제 URL은 명시되어 있지 않으므로 임의로 만들어 넣지 않고
 * 이름만 채운 플레이스홀더로 둔다 — 담당자가 실제 URL로 채워야 한다.
 */
export const RELATED_SITES: RelatedSite[] = [
  { name: "SFOOD 홈페이지", url: "" },
  { name: "SFOOD B2C 서비스", url: "" },
  { name: "SFOOD B2B 서비스", url: "" },
];
