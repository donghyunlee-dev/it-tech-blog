"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SearchOverlay } from "./SearchOverlay";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7.5" />
      <line x1="21" y1="21" x2="16.2" y2="16.2" />
    </svg>
  );
}

export function SiteHeader({ variant }: { variant: "home" | "detail" }) {
  const [searchOpen, setSearchOpen] = useState(false);

  // CommandPalette로 교체(2026-09-15)하면서 이름 그대로의 Cmd/Ctrl+K 단축키도 지원한다.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      {variant === "home" ? (
        <>
          <div className="utility-bar">
            <span />
            <button className="icon-btn" aria-label="검색 열기" onClick={() => setSearchOpen(true)}>
              <SearchIcon />
            </button>
          </div>
          <div className="masthead">
            <Link href="/" className="wordmark">
              S-FOOD TECH
            </Link>
            <p className="tagline">에쓰푸드 IT팀·AX팀의 기술 기록</p>
            <div className="rule" />
          </div>
        </>
      ) : (
        <div className="slim-header">
          <Link href="/" className="back-link">
            ← 목록으로
          </Link>
          <Link href="/" className="logo-mini">
            S-FOOD TECH
          </Link>
          <button className="icon-btn" aria-label="검색 열기" onClick={() => setSearchOpen(true)}>
            <SearchIcon />
          </button>
        </div>
      )}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
