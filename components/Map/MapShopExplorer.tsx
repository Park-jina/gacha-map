"use client";

import { useCallback, useMemo, useState } from "react";
import type { Shop } from "@/types/shop";
import KakaoMap, { type MapBounds } from "./KakaoMap";
import ShopList from "./ShopList";
import FilterBar from "./FilterBar";

interface MapShopExplorerProps {
  shops: Shop[];
}

/**
 * 지도 ↔ 리스트 인터랙션을 중개하는 클라이언트 컨테이너.
 *
 * 필터 파이프라인:
 *   전체 shops
 *     → brand/verified 필터링 → filteredShops (지도 마커 기준)
 *     → viewport(bounds) 필터링 → visibleShops (리스트 표시 기준)
 */
export default function MapShopExplorer({ shops }: MapShopExplorerProps) {
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [hoveredShopId, setHoveredShopId] = useState<string | null>(null);
  const [bounds, setBounds] = useState<MapBounds | null>(null);

  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const handleSelect = useCallback((shopId: string) => {
    setSelectedShopId((prev) => (prev === shopId ? prev : shopId));
  }, []);

  const handleHover = useCallback((shopId: string | null) => {
    setHoveredShopId(shopId);
  }, []);

  const handleBoundsChange = useCallback((next: MapBounds) => {
    setBounds(next);
  }, []);

  const handleToggleBrand = useCallback((brand: string) => {
    setSelectedBrands((prev) => {
      const next = new Set(prev);
      if (next.has(brand)) next.delete(brand);
      else next.add(brand);
      return next;
    });
  }, []);

  const handleClearBrands = useCallback(() => {
    setSelectedBrands(new Set());
  }, []);

  const handleToggleVerified = useCallback(() => {
    setVerifiedOnly((prev) => !prev);
  }, []);

  // 전체 샵에서 브랜드 목록(+건수)을 빈도 내림차순으로 뽑는다.
  const brandOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of shops) {
      if (!s.brand) continue;
      counts.set(s.brand, (counts.get(s.brand) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count || a.brand.localeCompare(b.brand));
  }, [shops]);

  // 1단계: 브랜드/검수 필터 (지도 마커에 그대로 반영)
  const filteredShops = useMemo(() => {
    if (selectedBrands.size === 0 && !verifiedOnly) return shops;
    return shops.filter((s) => {
      if (verifiedOnly && !s.verified) return false;
      if (selectedBrands.size > 0) {
        if (!s.brand || !selectedBrands.has(s.brand)) return false;
      }
      return true;
    });
  }, [shops, selectedBrands, verifiedOnly]);

  // 2단계: 현재 지도 영역 안에 있는 것만 리스트에 노출
  const visibleShops = useMemo(() => {
    if (!bounds) return filteredShops;
    return filteredShops.filter(
      (s) =>
        s.lat >= bounds.swLat &&
        s.lat <= bounds.neLat &&
        s.lng >= bounds.swLng &&
        s.lng <= bounds.neLng,
    );
  }, [filteredShops, bounds]);

  const totalCount = shops.length;
  const filteredCount = filteredShops.length;
  const visibleCount = visibleShops.length;
  const hasActiveFilter = selectedBrands.size > 0 || verifiedOnly;

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <section className="relative h-1/2 w-full md:h-full md:flex-1">
        <KakaoMap
          shops={filteredShops}
          selectedShopId={selectedShopId}
          hoveredShopId={hoveredShopId}
          onMarkerClick={handleSelect}
          onBoundsChange={handleBoundsChange}
        />
      </section>
      <aside className="h-1/2 w-full overflow-y-auto border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black md:h-full md:w-96 md:border-l md:border-t-0">
        <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 pb-3 pt-3 dark:border-zinc-800 dark:bg-black">
          <h1 className="text-lg font-semibold">가챠맵</h1>
          <p className="text-xs text-zinc-500">
            지도에 {visibleCount}곳
            {hasActiveFilter && (
              <span className="ml-1 text-zinc-400">
                / 필터 {filteredCount}곳
              </span>
            )}
            {visibleCount !== totalCount && (
              <span className="ml-1 text-zinc-400">
                / 전체 {totalCount}곳
              </span>
            )}
          </p>
          <FilterBar
            brandOptions={brandOptions}
            selectedBrands={selectedBrands}
            verifiedOnly={verifiedOnly}
            onToggleBrand={handleToggleBrand}
            onClearBrands={handleClearBrands}
            onToggleVerified={handleToggleVerified}
          />
        </header>
        <ShopList
          shops={visibleShops}
          selectedShopId={selectedShopId}
          hoveredShopId={hoveredShopId}
          onSelect={handleSelect}
          onHover={handleHover}
          emptyMessage={
            totalCount === 0
              ? "등록된 가챠샵이 아직 없어요."
              : hasActiveFilter && filteredCount === 0
              ? "필터 조건에 맞는 가챠샵이 없어요."
              : "이 영역엔 가챠샵이 없어요. 지도를 이동해보세요."
          }
        />
      </aside>
    </div>
  );
}
