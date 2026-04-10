# crawler

가챠샵 데이터 수집 파이프라인 (Next.js 앱과 완전 분리).

## 구조
- `main.py` — 엔트리포인트, 모든 source를 순회하며 수집 후 upsert
- `sources/` — 출처별 크롤러 (naver, instagram)
- `storage.py` — Supabase upsert 로직

## 환경 변수
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 실행
```bash
pip install -r crawler/requirements.txt
playwright install chromium
python crawler/main.py
```
