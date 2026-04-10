"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import type { Shop } from "@/types/shop";

interface KakaoMapProps {
  shops: Shop[];
  // 초기 중심. 미지정 시 서울시청.
  center?: { lat: number; lng: number };
  level?: number;
}

const SEOUL_CITY_HALL = { lat: 37.5665, lng: 126.978 };
const SDK_URL = `//dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY}`;

export default function KakaoMap({
  shops,
  center = SEOUL_CITY_HALL,
  level = 5,
}: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const markersRef = useRef<kakao.maps.Marker[]>([]);

  // SDK가 로드된 후 지도 초기화
  const initMap = () => {
    if (!containerRef.current || mapRef.current) return;
    window.kakao.maps.load(() => {
      mapRef.current = new window.kakao.maps.Map(containerRef.current!, {
        center: new window.kakao.maps.LatLng(center.lat, center.lng),
        level,
      });
      renderMarkers();
    });
  };

  // shops 변경 시 마커 재렌더링
  const renderMarkers = () => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = shops.map((shop) => {
      return new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(shop.lat, shop.lng),
        map,
        title: shop.name,
      });
    });
  };

  useEffect(() => {
    if (window.kakao?.maps) initMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    renderMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shops]);

  return (
    <>
      <Script src={SDK_URL} strategy="afterInteractive" onLoad={initMap} />
      <div ref={containerRef} className="h-full w-full" />
    </>
  );
}
