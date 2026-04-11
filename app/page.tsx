import { MapShopExplorer } from "@/components/Map";
import { fetchShops } from "@/lib/shops";

export default async function Home() {
  const shops = await fetchShops();

  return <MapShopExplorer shops={shops} />;
}
