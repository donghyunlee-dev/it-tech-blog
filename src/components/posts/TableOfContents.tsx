"use client";

import { useEffect, useRef, useState } from "react";
import type { TocHeading } from "@/lib/viewer/converter";

/** 뷰포트 위에서 이 지점을 지난 헤딩 중 가장 마지막 것을 "지금 읽는 중"으로 표시한다
 *  (Stripe Docs/Notion류 스크롤스파이 관행). IntersectionObserver의 좁은 관찰 구간 방식은
 *  헤딩 간격이 좁거나 넓을 때 "둘 다 활성 아님" 공백 구간이 생겨, 대신 각 헤딩의 현재 위치를
 *  직접 비교하는 방식을 쓴다. */
// 고정 헤더(.slim-header, 69px) + 여유 15px = 84px. globals.css의 .toc top / 헤딩
// scroll-margin-top과 같은 값으로 맞춰야, 헤딩이 헤더에 가려지기 직전 시점에 active가 바뀐다.
const ACTIVE_LINE_OFFSET = 84;

/** TOC 클릭 직후 스크롤 이벤트가 스크롤스파이 계산을 다시 덮어써 버리는 것을 막는 시간(ms).
 *  헤딩 간격이 좁으면(예: h2 바로 다음 줄이 h3) 점프 직후에도 h3가 여전히
 *  ACTIVE_LINE_OFFSET 안에 들어와 클릭한 h2 대신 h3가 다시 active로 계산돼 버린다 —
 *  이 창 동안은 클릭으로 지정한 값을 그대로 우선한다(2026-09-21). */
const CLICK_SUPPRESS_MS = 700;

export function TableOfContents({ headings }: { headings: TocHeading[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const tocRef = useRef<HTMLElement>(null);
  const suppressUntilRef = useRef(0);

  // 목차가 그리드 맨 위(제목 높이)에서 시작하지 않고 본문이 실제로 시작하는 높이에 맞춰
  // 내려오도록, 키커+제목+바이라인(+있으면 히어로 이미지) 높이만큼 위쪽 여백을 준다. 글마다
  // 제목 줄 수·히어로 유무가 달라 고정값을 쓸 수 없어 실제 높이를 측정한다.
  useEffect(() => {
    const toc = tocRef.current;
    const body = document.querySelector(".article-body");
    const main = document.querySelector(".article-main");
    if (!toc || !body || !main) return;

    function alignTocWithBody() {
      const offset = body!.getBoundingClientRect().top - main!.getBoundingClientRect().top;
      toc!.style.marginTop = `${Math.max(0, offset)}px`;
    }

    alignTocWithBody();
    window.addEventListener("resize", alignTocWithBody);
    return () => window.removeEventListener("resize", alignTocWithBody);
  }, [headings]);

  useEffect(() => {
    if (headings.length === 0) return;

    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    function updateActiveHeading() {
      if (Date.now() < suppressUntilRef.current) return;

      let current: string | null = null;
      for (const el of elements) {
        if (el.getBoundingClientRect().top <= ACTIVE_LINE_OFFSET) {
          current = el.id;
        } else {
          break;
        }
      }
      setActiveId(current);
    }

    updateActiveHeading();
    window.addEventListener("scroll", updateActiveHeading, { passive: true });
    window.addEventListener("resize", updateActiveHeading);
    return () => {
      window.removeEventListener("scroll", updateActiveHeading);
      window.removeEventListener("resize", updateActiveHeading);
    };
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <aside className="toc" ref={tocRef}>
      <span className="kicker">목차</span>
      <ul className="toc-list">
        {headings.map((heading) => (
          <li
            key={heading.id}
            className={[heading.level === 3 ? "sub" : "", heading.id === activeId ? "active" : ""]
              .filter(Boolean)
              .join(" ")}
          >
            <a
              href={`#${heading.id}`}
              onClick={() => {
                setActiveId(heading.id);
                suppressUntilRef.current = Date.now() + CLICK_SUPPRESS_MS;
              }}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/** 사이드바 목차(.toc)가 자리 없어 숨는 1340px 이하 화면 전용. 본문보다 먼저, 제목 바로
 *  아래에 문서형(카드+번호 매기기) 목차로 보여준다 — 사이드바의 얇은 선 스타일과는
 *  의도적으로 다른 디자인을 써서 "같은 목차의 축소판"이 아니라 별개의 문서 내비게이션처럼
 *  읽히게 한다. */
export function MobileTableOfContents({ headings }: { headings: TocHeading[] }) {
  if (headings.length === 0) return null;

  return (
    <details className="toc-inline" open>
      <summary className="toc-inline-summary">
        <span className="kicker">목차</span>
        <span className="toc-inline-count">{headings.length}개 항목</span>
      </summary>
      <ol className="toc-inline-list">
        {headings.map((heading) => (
          <li key={heading.id} className={heading.level === 3 ? "sub" : ""}>
            <a href={`#${heading.id}`}>{heading.text}</a>
          </li>
        ))}
      </ol>
    </details>
  );
}
