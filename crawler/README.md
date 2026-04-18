# crawler

가챠샵 데이터 수집 파이프라인 (Next.js 앱과 완전 분리).

## 구조

- `main.py` — 엔트리포인트, 소스별 수집 후 중복 제거 + Supabase upsert
- `sources/kakao.py` — 카카오 로컬 REST API 키워드 검색 (현행 주 소스)
- `sources/naver.py` — 네이버 로컬 검색 Open API (보조 소스, 키워드당 5건 한계)
- `sources/instagram.py` — 보류 (ToS / 유지보수 비용)
- `storage.py` — Supabase upsert. `(name, address)` 기준 unique, 중복 행은 건드리지 않음(사람이 고친 verified/brand 보존). dry-run 시 스키마 밖 필드(phone, category 등)도 함께 표시해 확장 후보를 드러낸다.

## 환경 변수

`.env` 또는 `.env.local`(프로젝트 루트)에서 자동 로드됨.

```
KAKAO_REST_API_KEY=...        # 카카오 디벨로퍼스 > 앱 > 앱 키 > REST API 키
NAVER_CLIENT_ID=...           # 네이버 Developers > 애플리케이션 > Client ID
NAVER_CLIENT_SECRET=...       # 네이버 Developers > 애플리케이션 > Client Secret
SUPABASE_URL=...              # Supabase 프로젝트 URL
SUPABASE_SERVICE_ROLE_KEY=... # RLS 우회 필요, 절대 브라우저/프론트로 노출 금지
```

카카오 REST API 키는 JavaScript 키와 다르다. 같은 카카오 앱 설정 페이지에서 별도로 확인할 수 있다.
네이버는 Developers 콘솔에서 "검색" API 사용 신청 후 Client ID/Secret을 발급받는다.

## 설치

```bash
cd crawler
pip install -r requirements.txt
```

## 실행

```bash
# 전체 소스 실행 후 Supabase에 upsert
python crawler/main.py

# DB 쓰기 없이 수집 결과만 확인
python crawler/main.py --dry-run

# 특정 소스만 실행
python crawler/main.py --source kakao
python crawler/main.py --source naver
```

## 카카오 소스 동작 방식

1. 키워드 리스트(`KEYWORDS`)를 순회하며 `https://dapi.kakao.com/v2/local/search/keyword.json` 호출
2. 각 키워드당 최대 `MAX_PAGES`(기본 3) 페이지 = 45건
3. 이름/카테고리에 가챠 관련 토큰이 있는 결과만 선별(false positive 줄이기)
4. 카카오 `place_id` 기준으로 dedupe → name+address 기준으로 2차 dedupe
5. 존재하지 않는 장소만 insert (`ignore_duplicates=True`)

수정 대상: `crawler/sources/kakao.py` 상단의 `KEYWORDS`, `POSITIVE_TOKENS`, `NEGATIVE_CATEGORY_PREFIXES`, `BRAND_HINTS`.

## 네이버 소스 동작 방식

1. `KEYWORDS` 를 순회하며 `https://openapi.naver.com/v1/search/local.json` 호출
2. Open API 한계로 키워드당 최대 5건 → 카카오보다 수집량 적음. 보조 용도.
3. 카카오와 동일한 토큰/카테고리 필터(`POSITIVE_TOKENS`, `NEGATIVE_CATEGORY_PREFIXES`)로 false positive 컷
4. 제목의 `<b>` 태그·HTML 엔티티 제거, `mapx/mapy` 를 WGS84(×10⁷)로 가정하고 한반도 범위 체크
5. 부가 필드 `telephone` → `phone`, `category` 를 딕셔너리에 담아 dry-run 출력에만 노출 (스키마 확장 전까지 DB 저장 안 됨)

수정 대상: `crawler/sources/naver.py` 상단의 `KEYWORDS` (필터는 kakao 모듈에서 import 해 공유).
