"""카카오 로컬 API 기반 가챠샵 크롤러.

Endpoint: https://dapi.kakao.com/v2/local/search/keyword.json
Docs: https://developers.kakao.com/docs/latest/ko/local/dev-guide#search-by-keyword

키워드 여러 개를 순회하며 전국 단위 키워드 검색을 수행한다.
카카오 로컬 검색은 페이지당 최대 15건, page 1~45 허용이지만
관련도 기반이라 실질적으로 상위 3~5 페이지에서 의미 있는 결과가 나온다.

참고:
- x = longitude, y = latitude (문자열로 옴)
- road_address_name 이 비어 있을 수 있으므로 address_name fallback
- 가챠와 무관한 결과가 섞여 들어오므로 이름/카테고리 기반 휴리스틱 필터링 적용
"""

from __future__ import annotations

import os
import time
from typing import Any, Dict, Iterable, List, Optional

import httpx

KAKAO_API = "https://dapi.kakao.com/v2/local/search/keyword.json"
SOURCE_NAME = "kakao_local"

# 검색에 사용할 키워드
# '토이캡슐'은 '캡슐토이'와 결과가 완전히 겹쳐서 제거함 (dry-run 결과 기준).
KEYWORDS: List[str] = [
    "가챠",
    "가챠샵",
    "가챠가챠",
    "캡슐토이",
    "뽑기샵",
]

# 결과가 실제 가챠 매장일 때 이름/카테고리에 자주 등장하는 토큰
POSITIVE_TOKENS: List[str] = [
    "가챠",
    "가차",
    "캡슐토이",
    "토이캡슐",
    "뽑기",
    "gacha",
    "gashapon",
]

# 카카오 카테고리 중 명확히 제외할 대분류 (음식점/카페/숙박 등)
NEGATIVE_CATEGORY_PREFIXES: List[str] = [
    "음식점",
    "카페",
    "숙박",
    "병원",
    "약국",
    "학원",
    "은행",
    "주유소",
    "부동산",
]

# 브랜드/체인 감지 (이름에 아래 토큰이 들어가면 brand 컬럼에 저장)
# 구체적인 체인명(공백 포함)을 먼저 두어 부분 일치 시 우선 매칭되게 한다.
BRAND_HINTS: Dict[str, str] = {
    # 체인
    "캑티 가챠샵": "캑티가챠샵",
    "캑티가챠샵": "캑티가챠샵",
    "퍼니랜드": "퍼니랜드",
    "브라더굿즈": "브라더굿즈",
    "가챠오션": "가챠오션",
    "가챠엑스": "가챠엑스",
    "가챠파크": "가챠파크",
    "가챠마트": "가챠마트",
    "구루구루가챠샵": "구루구루가챠샵",
    "호데데가챠샵": "호데데가챠샵",
    "행궁가챠": "행궁가챠",
    "봉봉가챠": "봉봉가챠",
    # 공식 수입/브랜드
    "반다이": "반다이",
    "가샤폰": "반다이",
    # 일반/fallback
    "이색잡화점": "이색잡화점",
    "가챠월드": "가챠월드",
    "뽑기의달인": "뽑기의달인",
}

PAGE_SIZE = 15
MAX_PAGES = 3  # 키워드당 최대 페이지 수 (관련도 떨어지는 하위 결과 배제)
REQUEST_TIMEOUT = 10.0
RETRY = 3
RETRY_DELAY = 1.5


def crawl() -> List[Dict[str, Any]]:
    """카카오 로컬 API로 모든 키워드를 검색하고, 가챠샵 후보 리스트를 반환한다.

    반환 딕셔너리는 shops 테이블 스키마와 매핑됨:
        name, address, lat, lng, brand, source, verified(=False)
    """
    api_key = _require_env("KAKAO_REST_API_KEY")
    headers = {"Authorization": f"KakaoAK {api_key}"}

    # place_id 기준 dedupe
    collected: Dict[str, Dict[str, Any]] = {}

    with httpx.Client(timeout=REQUEST_TIMEOUT, headers=headers) as client:
        for keyword in KEYWORDS:
            before = len(collected)
            for page in range(1, MAX_PAGES + 1):
                documents, is_end = _fetch_page(client, keyword, page)
                for doc in documents:
                    if not _is_gacha_like(doc):
                        continue
                    place_id = doc.get("id")
                    if not place_id or place_id in collected:
                        continue
                    shop = _to_shop(doc)
                    if shop:
                        collected[place_id] = shop
                if is_end:
                    break
            added = len(collected) - before
            print(f"[kakao] '{keyword}': +{added}건 (누적 {len(collected)})")

    shops = list(collected.values())
    print(f"[kakao] 총 {len(shops)}건 수집")
    return shops


# ---------- 내부 ----------


def _require_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(
            f"환경변수 {name} 가 설정되어 있지 않습니다. .env 또는 쉘 환경을 확인해주세요."
        )
    return value


def _fetch_page(
    client: httpx.Client, query: str, page: int
) -> tuple[List[Dict[str, Any]], bool]:
    params = {"query": query, "page": page, "size": PAGE_SIZE}
    last_err: Optional[Exception] = None
    for attempt in range(1, RETRY + 1):
        try:
            res = client.get(KAKAO_API, params=params)
            res.raise_for_status()
            data = res.json()
            documents = data.get("documents", []) or []
            is_end = bool(data.get("meta", {}).get("is_end", True))
            return documents, is_end
        except httpx.HTTPError as e:
            last_err = e
            if attempt < RETRY:
                time.sleep(RETRY_DELAY * attempt)
    print(f"[kakao] '{query}' page {page} 실패: {last_err}")
    return [], True


def _is_gacha_like(doc: Dict[str, Any]) -> bool:
    name = (doc.get("place_name") or "").lower()
    category = (doc.get("category_name") or "").lower()

    for prefix in NEGATIVE_CATEGORY_PREFIXES:
        if category.startswith(prefix.lower()) or f" > {prefix.lower()}" in category:
            return False

    haystack = f"{name} {category}"
    return any(token in haystack for token in POSITIVE_TOKENS)


def _to_shop(doc: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    name = (doc.get("place_name") or "").strip()
    address = (
        (doc.get("road_address_name") or "").strip()
        or (doc.get("address_name") or "").strip()
    )
    x = doc.get("x")
    y = doc.get("y")

    if not name or not address or x is None or y is None:
        return None

    try:
        lng = float(x)
        lat = float(y)
    except (TypeError, ValueError):
        return None

    brand = _detect_brand(name)
    shop: Dict[str, Any] = {
        "name": name,
        "address": address,
        "lat": lat,
        "lng": lng,
        "brand": brand,
        "source": SOURCE_NAME,
        "verified": False,
    }
    phone = (doc.get("phone") or "").strip()
    if phone:
        shop["phone"] = phone
    category = (doc.get("category_name") or "").strip()
    if category:
        shop["category"] = category
    return shop


def detect_brand(name: str) -> Optional[str]:
    """이름 문자열에서 브랜드/체인을 탐지. 못 찾으면 None."""
    for hint, brand in BRAND_HINTS.items():
        if hint in name:
            return brand
    return None


# 하위 호환
_detect_brand = detect_brand


def dedupe_by_name_address(
    shops: Iterable[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """동일 name+address 중복을 제거 (다른 소스와 합칠 때 사용)."""
    seen: Dict[tuple[str, str], Dict[str, Any]] = {}
    for shop in shops:
        key = (shop["name"], shop["address"])
        if key not in seen:
            seen[key] = shop
    return list(seen.values())
