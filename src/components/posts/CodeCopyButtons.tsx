"use client";

import { useEffect } from "react";

const COPIED_LABEL = "복사됨";
const RESET_MS = 1500;

/** .article-body는 dangerouslySetInnerHTML 정적 문자열이라(converter.ts) 복사 버튼 각각에
 *  React 이벤트 핸들러를 붙일 수 없다 — document 레벨 클릭 위임으로 [data-code-copy]를
 *  찾아 처리한다. 렌더링하는 요소는 없다(전역 리스너만 등록). */
export function CodeCopyButtons() {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const button = target.closest<HTMLButtonElement>("[data-code-copy]");
      if (!button) return;

      const pre = button.closest(".code-block")?.querySelector("pre");
      if (!pre) return;

      navigator.clipboard
        .writeText(pre.textContent ?? "")
        .then(() => {
          const original = button.textContent;
          button.textContent = COPIED_LABEL;
          button.disabled = true;
          setTimeout(() => {
            button.textContent = original;
            button.disabled = false;
          }, RESET_MS);
        })
        .catch(() => {
          // 클립보드 권한이 없는 등 실패해도 조용히 무시한다 — 코드 블록 자체는 여전히
          // 텍스트로 선택·복사 가능하다.
        });
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
