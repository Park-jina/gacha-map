"use client";

import { useEffect, useRef } from "react";
import type { Shop } from "@/types/shop";

interface ShopListProps {
  shops: Shop[];
  selectedShopId: string | null;
  hoveredShopId: string | null;
  onSelect: (shopId: string) => void;
  onHover: (shopId: string | null) => void;
  emptyMessage?: string;
}

export default function ShopList({
  shops,
  selectedShopId,
  hoveredShopId,
  onSelect,
  onHover,
  emptyMessage = "주변 가챠샵이 아직 없어요.",
}: ShopListProps) {
  const itemRefs = useRef<Record<string, HTMLLIElement | null>>({});

  // 선택된 항목을 뷰포트로 스크롤
  useEffect(() => {
    if (!selectedShopId) return;
    const el = itemRefs.current[selectedShopId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedShopId]);

  if (shops.length === 0) {
    return <div className="p-4 text-sm text-zinc-500">{emptyMessage}</div>;
  }

  return (
    <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {shops.map((shop) => {
        const isSelected = shop.id === selectedShopId;
        const isHovered = shop.id === hoveredShopId;
        return (
          <li
            key={shop.id}
            ref={(el) => {
              itemRefs.current[shop.id] = el;
            }}
            onMouseEnter={() => onHover(shop.id)}
            onMouseLeave={() => onHover(null)}
            className={[
              "relative cursor-pointer transition-colors",
              isSelected
                ? "bg-indigo-50 dark:bg-indigo-950/40"
                : isHovered
                ? "bg-zinc-50 dark:bg-zinc-900"
                : "",
            ].join(" ")}
          >
            {isSelected && (
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 w-1 bg-indigo-500"
              />
            )}
            <button
              type="button"
              onClick={() => onSelect(shop.id)}
              className="flex w-full flex-col gap-1 px-4 py-3 text-left"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{shop.name}</span>
                {shop.brand && (
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {shop.brand}
                  </span>
                )}
              </div>
              <span className="text-sm text-zinc-500">{shop.address}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
