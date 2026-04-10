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
    }

    class Map {
      constructor(container: HTMLElement, options: { center: LatLng; level: number });
      setCenter(latlng: LatLng): void;
      setLevel(level: number): void;
    }

    class Marker {
      constructor(options: { position: LatLng; map?: Map; title?: string });
      setMap(map: Map | null): void;
    }

    class InfoWindow {
      constructor(options: { content: string });
      open(map: Map, marker: Marker): void;
      close(): void;
    }

    namespace event {
      function addListener(target: unknown, type: string, handler: () => void): void;
    }
  }
}

export {};
