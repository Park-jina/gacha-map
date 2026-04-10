import { KakaoMap, ShopList } from "@/components/Map";
import { fetchShops } from "@/lib/shops";

export default async function Home() {
  const shops = await fetchShops();

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <section className="relative h-1/2 w-full md:h-full md:flex-1">
        <KakaoMap shops={shops} />
      </section>
      <aside className="h-1/2 w-full overflow-y-auto border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black md:h-full md:w-96 md:border-l md:border-t-0">
        <header className="sticky top-0 border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-black">
          <h1 className="text-lg font-semibold">가챠맵</h1>
          <p className="text-xs text-zinc-500">
            전국 가챠샵 {shops.length}곳
          </p>
        </header>
        <ShopList shops={shops} />
      </aside>
    </div>
  );
}
