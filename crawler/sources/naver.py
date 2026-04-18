"""네이버 로컬 검색 Open API 기반 가챠샵 크롤러.

Endpoint: https://openapi.naver.com/v1/search/local.json
Docs: https://developers.naver.com/docs/serviceapi/search/local/local.md

제약/참고:
- 한 호출당 최대 5건(`display ≤ 5`), `start` 는 1만 의미 있음.
  → 실질적으로 키워드당 5건이 한계라, 키워드 다변화로 커버리지를 보충한다.
- `mapx`/`mapy` 는 WGS84 좌표 × 10^7 정수 문자열 (v1 로컬 API, 2022년 이후).
  한반도 범위 벗어나면 레거시 KATEC 포맷 가능성 있어 폐기한다.
- `title` 에 `<b>` 태그와 HTML 엔티티가 섞여 오므로 반드시 strip.
- `opening_hours` / `photo_url` 은 Open API 응답에 없음. 확보하려면 Playwright
  기반 플레이스 상세 페이지 스크래핑이 필요 (현재 범위 아님).
"""

from __future__ import annotations

import html
import os
import re
import time
from typing import Any, Dict, List, Optional

import httpx

from .kakao import (
    NEGATIVE_CATEGORY_PREFIXES,
    POSITIVE_TOKENS,
    detect_brand,
)

NAVER_API = "https://openapi.naver.com/v1/search/local.json"
SOURCE_NAME = "naver_place"

KEYWORDS: List[str] = [
    "가챠",
    "가챠샵",
    "가챠가챠",
    "캡슐토이",
    "뽑기샵",
]

DISPLAY = 5  # Open API 허용 최대값
REQUEST_TIMEOUT = 10.0
RETRY = 3
RETRY_DELAY = 1.5

_HTML_TAG = re.compile(r"<[^>]+>")


def crawl() -> List[Dict[str, Any]]:
    """네이버 로컬 검색으로 모든 키워드를 훑어 가챠샵 후보 리스트를 반환한다.

    반환 딕셔너리는 shops 테이블 스키마와 매핑:
        name, address, lat, lng, brand, source, verified(=False)
    추가 메타(phone, category)는 `ALLOWED_COLUMNS` 밖이라 DB 저장 시 버려지지만
    dry-run 출력/후속 스키마 확장 검토용으로 딕셔너리에 동봉한다.
    """
    client_id = _require_env("NAVER_CLIENT_ID")
    client_secret = _require_env("NAVER_CLIENT_SECRET")
    headers = {
        "X-Naver-Client-Id": client_id,
        "X-Naver-Client-Secret": client_secret,
    }

    collected: Dict[tuple[str, str], Dict[str, Any]] = {}

    with httpx.Client(timeout=REQUEST_TIMEOUT, headers=headers) as client:
        for keyword in KEYWORDS:
            before = len(collected)
            for item in _fetch(client, keyword):
                if not _is_gacha_like(item):
                    continue
                shop = _to_shop(item)
                if not shop:
                    continue
                key = (shop["name"], shop["address"])
                if key not in collected:
                    collected[key] = shop
            added = len(collected) - before
            print(f"[naver] '{keyword}': +{added}건 (누적 {len(collected)})")

    shops = list(collected.values())
    print(f"[naver] 총 {len(shops)}건 수집")
    return shops


# ---------- 내부 ----------


def _require_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(
            f"환경변수 {name} 가 설정되어 있지 않습니다. .env 또는 쉘 환경을 확인해주세요."
        )
    return value


def _fetch(client: httpx.Client, query: str) -> List[Dict[str, Any]]:
    params = {"query": query, "display": DISPLAY, "start": 1, "sort": "random"}
    last_err: Optional[Exception] = None
    for attempt in range(1, RETRY + 1):
        try:
            res = client.get(NAVER_API, params=params)
            res.raise_for_status()
            data = res.json()
            return data.get("items", []) or []
        except httpx.HTTPError as e:
            last_err = e
            if attempt < RETRY:
                time.sleep(RETRY_DELAY * attempt)
    print(f"[naver] '{query}' 실패: {last_err}")
    return []


def _is_gacha_like(item: Dict[str, Any]) -> bool:
    name = _strip_title(item.get("title") or "").lower()
    category = (item.get("category") or "").lower()

    for prefix in NEGATIVE_CATEGORY_PREFIXES:
        if prefix.lower() in category:
            return False

    haystack = f"{name} {category}"
    return any(token in haystack for token in POSITIVE_TOKENS)


def _to_shop(item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    name = _strip_title(item.get("title") or "").strip()
    address = (
        (item.get("roadAddress") or "").strip()
        or (item.get("address") or "").strip()
    )
    if not name or not address:
        return None

    lat, lng = _parse_coords(item.get("mapy"), item.get("mapx"))
    if lat is None or lng is None:
        return None

    shop: Dict[str, Any] = {
        "name": name,
        "address": address,
        "lat": lat,
        "lng": lng,
        "brand": detect_brand(name),
        "source": SOURCE_NAME,
        "verified": False,
    }

    phone = (item.get("telephone") or "").strip()
    if phone:
        shop["phone"] = phone
    category = (item.get("category") or "").strip()
    if category:
        shop["category"] = category
    return shop


def _parse_coords(mapy: Any, mapx: Any) -> tuple[Optional[float], Optional[float]]:
    """네이버 v1 로컬 검색의 mapx/mapy → (lat, lng) WGS84.

    2022년 이후 응답은 정수 × 10^7 포맷. 한반도 범위 밖이면 레거시 KATEC 으로 보고 폐기.
    """
    try:
        x_raw = float(mapx) if mapx is not None else None
        y_raw = float(mapy) if mapy is not None else None
    except (TypeError, ValueError):
        return None, None
    if x_raw is None or y_raw is None:
        return None, None

    lng = x_raw / 1e7
    lat = y_raw / 1e7
    if not (124.0 <= lng <= 132.0 and 33.0 <= lat <= 39.0):
        return None, None
    return lat, lng


def _strip_title(text: str) -> str:
    return html.unescape(_HTML_TAG.sub("", text))
