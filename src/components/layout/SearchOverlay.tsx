"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CommandPalette, type CommandGroup } from "@sfood/ui";

interface SearchPost {
  slug: string;
  title: string;
  metaDescription: string;
}

/**
 * @sfood/ui의 CommandPalette로 교체(2026-09-15, 전면 도입 결정). 검색 입력·필터링·
 * 키보드 탐색·Escape/배경 클릭 닫기를 컴포넌트가 전담해 커스텀 마크업이 크게 줄었다.
 * CommandItem.label이 string 고정이라 검색어 인라인 하이라이트(Highlight 컴포넌트)는
 * 이 화면에는 적용할 수 없어 사용하지 않는다.
 */
export function SearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [posts, setPosts] = useState<SearchPost[]>([]);

  useEffect(() => {
    if (!open || posts.length > 0) return;
    let cancelled = false;
    fetch("/api/viewer/posts")
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) setPosts(data.posts ?? []);
      })
      .catch(() => {
        if (!cancelled) setPosts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, posts.length]);

  const groups: CommandGroup[] = [
    {
      key: "posts",
      label: "게시글",
      items: posts.map((post) => ({
        id: post.slug,
        label: post.title,
        description: post.metaDescription || undefined,
        onSelect: () => {
          onClose();
          router.push(`/posts/${post.slug}`);
        },
      })),
    },
  ];

  return (
    <CommandPalette
      open={open}
      onClose={onClose}
      placeholder="글 제목으로 검색해보세요"
      groups={groups}
      emptyMessage="일치하는 글이 없습니다."
    />
  );
}
