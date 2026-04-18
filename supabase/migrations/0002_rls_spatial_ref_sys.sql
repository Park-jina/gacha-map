-- PostGIS가 public.spatial_ref_sys 참조 테이블을 공개 스키마에 생성하는데,
-- Supabase 린터가 "RLS 꺼져있음 / public 스키마" 를 critical 로 경고한다.
-- 본 테이블은 EPSG 등 공간 참조계 메타데이터로 read-only 공개 데이터이므로,
-- RLS 를 켜고 SELECT만 누구에게나 허용하는 정책으로 경고를 해소한다.
alter table public.spatial_ref_sys enable row level security;

drop policy if exists "spatial_ref_sys is readable by anyone" on public.spatial_ref_sys;
create policy "spatial_ref_sys is readable by anyone"
  on public.spatial_ref_sys for select
  using (true);
