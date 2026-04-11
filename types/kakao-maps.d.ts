// 최소한의 카카오맵 SDK 타입. 필요한 것만 선언한다.
// 전체 스펙: https://apis.map.kakao.com/web/documentation/

declare global {
  interface Window {
    kakao: typeof kakao;
  }

  namespace kakao.maps {
    function load(callback: () => void): void;

    class LatLng {
      constructor(lat: number, lng: number);
      getLat(): number;
      getLng(): number;
    }

    class LatLngBounds {
      constructor();
      getSouthWest(): LatLng;
      getNorthEast(): LatLng;
      contains(latlng: LatLng): boolean;
    }

    class Map {
      constructor(container: HTMLElement, options: { center: LatLng; level: number });
      setCenter(latlng: LatLng): void;
      setLevel(level: number): void;
      panTo(latlng: LatLng): void;
      getBounds(): LatLngBounds;
    }

    class Marker {
      constructor(options: { position: LatLng; map?: Map; title?: string; zIndex?: number });
      setMap(map: Map | null): void;
      setZIndex(zIndex: number): void;
      getPosition(): LatLng;
    }

    class InfoWindow {
      constructor(options: { content: string; removable?: boolean });
      open(map: Map, marker: Marker): void;
      close(): void;
    }

    // libraries=clusterer 로드 시 사용 가능
    class MarkerClusterer {
      constructor(options: {
        map: Map;
        averageCenter?: boolean;
        minLevel?: number;
        minClusterSize?: number;
        disableClickZoom?: boolean;
        gridSize?: number;
        styles?: Array<Record<string, string>>;
      });
      addMarker(marker: Marker): void;
      addMarkers(markers: Marker[]): void;
      removeMarker(marker: Marker): void;
      removeMarkers(markers: Marker[]): void;
      clear(): void;
    }

    namespace event {
      function addListener(target: unknown, type: string, handler: () => void): void;
    }
  }
}

export {};
