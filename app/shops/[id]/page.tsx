import { fetchShopById } from "@/lib/shops";
import { notFound } from "next/navigation";

interface ShopDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ShopDetailPage({ params }: ShopDetailPageProps) {
  const { id } = await params;
  const shop = await fetchShopById(id);

  if (!shop) notFound();

  return (
    <main>
      <h1>{shop.name}</h1>
      <p>{shop.address}</p>
      {shop.brand && <p>브랜드: {shop.brand}</p>}
    </main>
  );
}
