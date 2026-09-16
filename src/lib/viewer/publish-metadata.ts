/**
 * Editor가 Confluence content property(`publishMetadata`)에 쓰는 게시 정보의 읽기 전용 형태.
 * Editor와 코드를 공유하지 않으므로(architecture.md 참고), Viewer 쪽에서 같은 데이터 구조를 독립적으로 정의한다.
 *
 * 2026-09-15 확정: 실제 게시된 문서의 content property를 직접 조회해 Editor 저장소
 * (`src/lib/editor/publish.ts`)의 실제 구현과 대조했다. 과거 이 파일이 가정하던 평면 구조
 * (`targetViewers: string[]`, 최상위 `slug`/`metaDescription`)는 실제와 다르며,
 * `category`/`series` 필드는 Editor 어디에도 쓰는 코드가 없어 제거한다(존재하지 않는 값을
 * 화면에 노출 조건으로만 남겨두는 것은 오해의 소지가 있다 — 필요해지면 그때 다시 추가한다).
 * 태그는 이 property가 아니라 Confluence 네이티브 페이지 레이블로 구현되어 있어(Editor
 * data-spec.md), 조회하려면 별도의 레이블 API 호출이 필요하다(이번 범위 아님).
 */
export interface PublishViewerMetadata {
  /** 작성자가 입력한 원본 slug(전역 유니크 보장 안 됨) — 화면에는 쓰지 않는다. */
  slug: string;
  metaDescription: string;
  /** `${slug}-${Confluence 페이지 title(UUID)}` 형태로 서버가 생성하는 전역 유니크 slug.
   *  Viewer의 공개 경로(`/posts/{publicSlug}`)는 반드시 이 값을 사용해야 한다. */
  publicSlug: string;
}

export interface PublishMetadata {
  isPublished: boolean;
  publishedAt?: string;
  /** 노출 대상 Viewer id(예: "tech-blog")를 키로 하는 뷰어별 게시 정보. */
  viewers: Record<string, PublishViewerMetadata>;
}
