/**
 * Editor가 Confluence content property(`publishMetadata`)에 쓰는 게시 정보의 읽기 전용 형태.
 * Editor와 코드를 공유하지 않으므로(architecture.md 참고), Viewer 쪽에서 같은 데이터 구조를 독립적으로 정의한다.
 */
export interface PublishMetadata {
  isPublished: boolean;
  targetViewers: string[];
  slug?: string;
  metaDescription?: string;
  publishedAt?: string;
}
