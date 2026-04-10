// shops 테이블과 1:1 매핑되는 타입.
// DB 스키마 변경 시 반드시 이 파일도 함께 수정한다.

export interface Shop {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  brand: string | null;
  source: string | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export type ShopInsert = Omit<Shop, "id" | "created_at" | "updated_at">;
