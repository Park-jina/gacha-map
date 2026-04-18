"use client";

import Link from "next/link";
import type { Shop } from "@/types/shop";

interface ShopDetailPanelProps {
  shop: Shop;
  onBack: () => void;
}

export default function ShopDetailPanel({ shop, onBack }: ShopDetailPanelProps) {
  const kakaoMapUrl = `https://map.kakao.com/link/map/${encodeURIComponent(
    shop.name,
  )},${shop.lat},${shop.lng}`;
  const kakaoDirectionsUrl = `https://map.kakao.com/link/to/${encodeURIComponent(
    shop.name,
  )},${shop.lat},${shop.lng}`;
  const reportSubject = encodeURIComponent(`[가챠맵 제보] ${shop.name}`);
  const reportBody = encodeURIComponent(
    `샵 ID: ${shop.id}\n샵 이름: ${shop.name}\n주소: ${shop.address}\n\n아래에 수정/추가할 정보를 적어주세요:\n- 운영시간:\n- 대표 사진 URL:\n- 기타:\n`,
  );
  const reportUrl = `mailto:pjina91@gmail.com?subject=${reportSubject}&body=${reportBody}`;

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-zinc-200 bg-white px-2 py-2 dark:border-zinc-800 dark:bg-black">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md px-2 py-1 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
          aria-label="목록으로 돌아가기"
        >
          ← 목록
        </button>
        <Link
          href={`/shops/${shop.id}`}
          className="ml-auto rounded-md px-2 py-1 text-xs text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
        >
          상세 페이지 ↗
        </Link>
      </div>

      <div className="px-4 py-4">
        <div className="flex items-start gap-2">
          <h2 className="flex-1 text-lg font-semibold leading-tight">
            {shop.name}
          </h2>
          {shop.verified && (
            <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              검수됨
            </span>
          )}
        </div>
        {(shop.brand || shop.category) && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {shop.brand && (
              <span className="inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                {shop.brand}
              </span>
            )}
            {shop.category && (
              <span className="text-xs text-zinc-500 dark:text-zinc-500">
                {shop.category}
              </span>
            )}
          </div>
        )}
        <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
          {shop.address}
        </p>
        {shop.phone && (
          <p className="mt-1 text-sm">
            <a
              href={`tel:${shop.phone.replace(/[^0-9+]/g, "")}`}
              className="text-brand hover:underline"
            >
              {shop.phone}
            </a>
          </p>
        )}
      </div>

      <div className="flex gap-2 px-4 pb-4">
        <a
          href={kakaoMapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded-md border border-zinc-200 px-3 py-2 text-center text-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
        >
          카카오맵
        </a>
        <a
          href={kakaoDirectionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded-md bg-brand px-3 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-brand-hover"
        >
          길찾기
        </a>
      </div>

      <Section title="운영시간">
        <Placeholder>
          아직 등록된 운영시간이 없어요.
        </Placeholder>
      </Section>

      <Section title="사진">
        <Placeholder>
          아직 등록된 사진이 없어요.
        </Placeholder>
      </Section>

      <Section title="정보가 다르거나 부족한가요?">
        <a
          href={reportUrl}
          className="inline-block rounded-md border border-zinc-300 px-3 py-2 text-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          정보 제보하기 →
        </a>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-zinc-200 px-4 py-4 dark:border-zinc-800">
      <h3 className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-zinc-500 dark:text-zinc-400">{children}</p>
  );
}
