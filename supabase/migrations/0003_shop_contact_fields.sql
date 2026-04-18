-- shops 테이블에 연락처/카테고리 필드 추가.
-- 네이버 로컬 Open API 가 제공하는 telephone, category 를 담기 위한 최소 확장.
-- opening_hours / photo_url / instagram_handle 은 현재 소스 없음 → 별도 마이그레이션으로 미룸.

alter table shops
  add column if not exists phone text,
  add column if not exists category text;
