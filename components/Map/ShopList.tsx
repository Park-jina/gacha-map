import Link from "next/link";
import type { Shop } from "@/types/shop";

interface ShopListProps {
  shops: Shop[];
}

export default function ShopList({ shops }: ShopListProps) {
  if (shops.length === 0) {
    return (
      <div className="p-4 text-sm text-zinc-500">
        주변 가챠샵이 아직 없어요.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {shops.map((shop) => (
        <li key={shop.id}>
          <Link
            href={`/shops/${shop.id}`}
            className="flex flex-col gap-1 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900"
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
          </Link>
        </li>
      ))}
    </ul>
  );
}
