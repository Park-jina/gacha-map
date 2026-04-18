"use client";

interface BrandOption {
  brand: string;
  count: number;
}

interface FilterBarProps {
  brandOptions: BrandOption[];
  selectedBrands: Set<string>;
  verifiedOnly: boolean;
  onToggleBrand: (brand: string) => void;
  onClearBrands: () => void;
  onToggleVerified: () => void;
}

/**
 * 사이드바 상단의 필터 바.
 * - 검수 토글 (verified=true만 보기)
 * - 브랜드 칩 (복수 선택, 빈도 순 정렬)
 *
 * 브랜드 후보가 없으면 칩 영역 자체를 숨긴다.
 */
export default function FilterBar({
  brandOptions,
  selectedBrands,
  verifiedOnly,
  onToggleBrand,
  onClearBrands,
  onToggleVerified,
}: FilterBarProps) {
  const hasBrands = brandOptions.length > 0;
  const anySelected = selectedBrands.size > 0;

  return (
    <div className="flex flex-col gap-2 pt-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleVerified}
          aria-pressed={verifiedOnly}
          className={[
            "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            verifiedOnly
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-zinc-300 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600",
          ].join(" ")}
        >
          <span aria-hidden>{verifiedOnly ? "✓" : "○"}</span>
          검수됨만
        </button>

        {anySelected && (
          <button
            type="button"
            onClick={onClearBrands}
            className="text-xs text-zinc-500 underline-offset-2 hover:underline"
          >
            브랜드 초기화
          </button>
        )}
      </div>

      {hasBrands && (
        <div className="-mx-4 overflow-x-auto px-4">
          <div className="flex min-w-max gap-1.5">
            {brandOptions.map(({ brand, count }) => {
              const active = selectedBrands.has(brand);
              return (
                <button
                  key={brand}
                  type="button"
                  onClick={() => onToggleBrand(brand)}
                  aria-pressed={active}
                  className={[
                    "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs transition-colors",
                    active
                      ? "border-brand bg-brand text-white"
                      : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600",
                  ].join(" ")}
                >
                  <span>{brand}</span>
                  <span
                    className={[
                      "rounded-full px-1 text-[10px] leading-4",
                      active
                        ? "bg-white/25 text-white"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
                    ].join(" ")}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
