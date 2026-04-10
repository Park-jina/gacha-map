-- 가챠샵 초기 스키마
create extension if not exists postgis;

create table if not exists shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  lat double precision not null,
  lng double precision not null,
  brand text,
  source text,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, address)
);

-- 공간 인덱스용 generated 컬럼 (PostGIS geography)
alter table shops
  add column if not exists geog geography(point, 4326)
  generated always as (st_setsrid(st_makepoint(lng, lat), 4326)::geography) stored;

create index if not exists shops_geog_idx on shops using gist (geog);
create index if not exists shops_brand_idx on shops (brand);

-- updated_at 자동 갱신
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists shops_set_updated_at on shops;
create trigger shops_set_updated_at
  before update on shops
  for each row execute function set_updated_at();

-- RLS: 읽기는 public, 쓰기는 service role만
alter table shops enable row level security;

drop policy if exists "shops are readable by anyone" on shops;
create policy "shops are readable by anyone"
  on shops for select
  using (true);
