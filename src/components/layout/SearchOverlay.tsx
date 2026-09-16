"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CommandPalette, type CommandGroup } from "@sfood/ui";

interface SearchPost {
  slug: string;
  title: string;
  metaDescription: string;
  tags: string[];
}

/** 게시글 목록에서 태그별 건수를 집계한다(건수 내림차순, 동률이면 가나다순). */
function countTags(posts: SearchPost[]): Array<{ tag: string; count: number }> {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
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

  const tagCounts = useMemo(() => countTags(posts), [posts]);

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

  // 태그가 붙은 게시글이 하나도 없으면 그룹 자체를 보여주지 않는다.
  if (tagCounts.length > 0) {
    groups.push({
      key: "tags",
      label: "태그",
      items: tagCounts.map(({ tag, count }) => ({
        id: `tag:${tag}`,
        label: `${tag} (${count})`,
        onSelect: () => {
          onClose();
          router.push(`/tags/${encodeURIComponent(tag)}`);
        },
      })),
    });
  }

  return (
    <CommandPalette
      open={open}
      onClose={onClose}
      placeholder="글 제목이나 태그로 검색해보세요"
      groups={groups}
      emptyMessage="일치하는 글이 없습니다."
    />
  );
}
