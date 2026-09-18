"use client";

import { useEffect, useState } from "react";
import type { TocHeading } from "@/lib/viewer/converter";

/** 뷰포트 위에서 이 지점을 지난 헤딩 중 가장 마지막 것을 "지금 읽는 중"으로 표시한다
 *  (Stripe Docs/Notion류 스크롤스파이 관행). IntersectionObserver의 좁은 관찰 구간 방식은
 *  헤딩 간격이 좁거나 넓을 때 "둘 다 활성 아님" 공백 구간이 생겨, 대신 각 헤딩의 현재 위치를
 *  직접 비교하는 방식을 쓴다. */
const ACTIVE_LINE_OFFSET = 120;

export function TableOfContents({ headings }: { headings: TocHeading[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;

    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    function updateActiveHeading() {
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
    <aside className="toc">
      <span className="kicker">목차</span>
      <ul className="toc-list">
        {headings.map((heading) => (
          <li
            key={heading.id}
            className={[heading.level === 3 ? "sub" : "", heading.id === activeId ? "active" : ""]
              .filter(Boolean)
              .join(" ")}
          >
            <a href={`#${heading.id}`}>{heading.text}</a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
