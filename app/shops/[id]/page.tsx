import { MapShopExplorer } from "@/components/Map";
import { fetchShopById, fetchShops } from "@/lib/shops";
import { notFound } from "next/navigation";

interface ShopDetailPageProps {
  params: Promise<{ id: string }>;
}

// 딥링크/공유 URL 진입점. 지도 + 패널을 함께 여는 하이브리드 구조라
// 홈과 동일한 explorer를 렌더하되 initialSelectedShopId로 패널을 열어둔다.
export default async function ShopDetailPage({ params }: ShopDetailPageProps) {
  const { id } = await params;
  const [shop, shops] = await Promise.all([fetchShopById(id), fetchShops()]);

  if (!shop) notFound();

  return <MapShopExplorer shops={shops} initialSelectedShopId={id} />;
}

export async function generateMetadata({ params }: ShopDetailPageProps) {
  const { id } = await params;
  const shop = await fetchShopById(id);
  if (!shop) return { title: "가챠맵" };
  return {
    title: `${shop.name} — 가챠맵`,
    description: shop.address,
  };
}
