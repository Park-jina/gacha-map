"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import type { Shop } from "@/types/shop";

export interface MapBounds {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}

interface KakaoMapProps {
  shops: Shop[];
  selectedShopId: string | null;
  hoveredShopId: string | null;
  onMarkerClick: (shopId: string) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  // 초기 중심. 미지정 시 서울시청.
  center?: { lat: number; lng: number };
  level?: number;
}

const SEOUL_CITY_HALL = { lat: 37.5665, lng: 126.978 };
const SDK_URL = `//dapi.kakao.com/v2/maps/sdk.js?autoload=false&libraries=clusterer&appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY}`;

const Z_INDEX_DEFAULT = 1;
const Z_INDEX_HOVER = 10;
const Z_INDEX_SELECTED = 20;

export default function KakaoMap({
  shops,
  selectedShopId,
  hoveredShopId,
  onMarkerClick,
  onBoundsChange,
  center = SEOUL_CITY_HALL,
  level = 5,
}: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const markersRef = useRef<Map<string, kakao.maps.Marker>>(new Map());
  const clustererRef = useRef<kakao.maps.MarkerClusterer | null>(null);
  const infoWindowRef = useRef<kakao.maps.InfoWindow | null>(null);
  const readyRef = useRef(false);

  // 최신 콜백을 effect 안에서 참조하기 위한 ref
  const onMarkerClickRef = useRef(onMarkerClick);
  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);

  const onBoundsChangeRef = useRef(onBoundsChange);
  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange;
  }, [onBoundsChange]);

  const emitBounds = () => {
    const map = mapRef.current;
    const cb = onBoundsChangeRef.current;
    if (!map || !cb) return;
    const b = map.getBounds();
    const sw = b.getSouthWest();
    const ne = b.getNorthEast();
    cb({
      swLat: sw.getLat(),
      swLng: sw.getLng(),
      neLat: ne.getLat(),
      neLng: ne.getLng(),
    });
  };

  // SDK 로드 후 지도 초기화
  const initMap = () => {
    if (!containerRef.current || mapRef.current) return;
    window.kakao.maps.load(() => {
      mapRef.current = new window.kakao.maps.Map(containerRef.current!, {
        center: new window.kakao.maps.LatLng(center.lat, center.lng),
        level,
      });
      clustererRef.current = new window.kakao.maps.MarkerClusterer({
        map: mapRef.current,
        averageCenter: true,
        minLevel: 6, // 지도 레벨이 6 이상(더 축소)일 때 클러스터링
        minClusterSize: 2,
        disableClickZoom: false, // 클러스터 클릭 시 자동 확대
        gridSize: 60,
      });
      infoWindowRef.current = new window.kakao.maps.InfoWindow({
        content: "",
        removable: true,
      });
      // 팬/줌 종료 시 bounds 업데이트
      window.kakao.maps.event.addListener(mapRef.current, "idle", emitBounds);
      readyRef.current = true;
      renderMarkers();
      applySelection();
      applyHover();
      emitBounds();
    });
  };

  // shops 변경 시 마커 재생성 (클러스터러 경유)
  const renderMarkers = () => {
    const map = mapRef.current;
    const clusterer = clustererRef.current;
    if (!map || !clusterer) return;

    clusterer.clear();
    markersRef.current = new globalThis.Map();

    const markers: kakao.maps.Marker[] = [];
    shops.forEach((shop) => {
      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(shop.lat, shop.lng),
        title: shop.name,
        zIndex: Z_INDEX_DEFAULT,
      });
      window.kakao.maps.event.addListener(marker, "click", () => {
        onMarkerClickRef.current(shop.id);
      });
      markersRef.current.set(shop.id, marker);
      markers.push(marker);
    });
    clusterer.addMarkers(markers);
  };

  // 선택된 샵으로 panTo + InfoWindow 오픈
  const applySelection = () => {
    const map = mapRef.current;
    const infoWindow = infoWindowRef.current;
    if (!map || !infoWindow) return;

    // 모든 마커 z-index 리셋
    markersRef.current.forEach((m) => m.setZIndex(Z_INDEX_DEFAULT));

    if (!selectedShopId) {
      infoWindow.close();
      return;
    }

    const marker = markersRef.current.get(selectedShopId);
    const shop = shops.find((s) => s.id === selectedShopId);
    if (!marker || !shop) {
      infoWindow.close();
      return;
    }

    marker.setZIndex(Z_INDEX_SELECTED);
    map.panTo(marker.getPosition());

    // 간단한 InfoWindow content (XSS 방지를 위한 이스케이프)
    // 카카오 InfoWindow 기본 스타일에 먹히지 않도록 color를 명시.
    const content = `
      <div style="padding:10px 14px 10px 12px;min-width:180px;font-size:13px;line-height:1.4;color:#18181b;">
        <div style="font-weight:600;margin-bottom:3px;color:#18181b;">${escapeHtml(shop.name)}</div>
        <div style="color:#71717a;font-size:12px;">${escapeHtml(shop.address)}</div>
      </div>
    `;
    // Kakao InfoWindow는 content를 생성자에만 받아서, 동적 변경은 재생성이 필요.
    infoWindowRef.current = new window.kakao.maps.InfoWindow({
      content,
      removable: true,
    });
    infoWindowRef.current.open(map, marker);
  };

  // hover 상태: z-index만 끌어올림
  const applyHover = () => {
    if (!readyRef.current) return;
    markersRef.current.forEach((marker, id) => {
      if (id === selectedShopId) return; // 선택 우선
      marker.setZIndex(id === hoveredShopId ? Z_INDEX_HOVER : Z_INDEX_DEFAULT);
    });
  };

  useEffect(() => {
    if (window.kakao?.maps) initMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!readyRef.current) return;
    renderMarkers();
    applySelection();
    applyHover();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shops]);

  useEffect(() => {
    applySelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShopId]);

  useEffect(() => {
    applyHover();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoveredShopId]);

  return (
    <>
      <Script src={SDK_URL} strategy="afterInteractive" onLoad={initMap} />
      <div ref={containerRef} className="h-full w-full" />
    </>
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
