-- 개발용 샘플 가챠샵 5곳 (실제 영업 정보 아님, 위치만 실존 근처)
-- 재실행해도 중복 없이 삽입되도록 ON CONFLICT DO NOTHING 사용

insert into shops (name, address, lat, lng, brand, source, verified) values
  ('명동 가챠스팟',      '서울 중구 명동길 26',             37.5636, 126.9826, '가챠가챠', 'sample', true),
  ('홍대 캡슐타운',      '서울 마포구 양화로 지하 188',    37.5572, 126.9240, '扭蛋',     'sample', true),
  ('강남역 가챠파크',    '서울 강남구 강남대로 396',        37.4980, 127.0276, '가챠가챠', 'sample', true),
  ('건대 커먼그라운드 가챠존', '서울 광진구 아차산로 200', 37.5404, 127.0698, '에브리가챠', 'sample', false),
  ('신촌 토이캡슐',      '서울 서대문구 신촌로 83',         37.5559, 126.9368, null,       'sample', false)
on conflict (name, address) do nothing;
