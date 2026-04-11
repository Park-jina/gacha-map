"""크롤링 결과를 Supabase에 upsert.

정책:
- (name, address) 기준 unique constraint 가 있으므로 중복 시 insert 스킵.
- 기존 레코드의 verified / brand 등은 덮어쓰지 않는다 (사람이 고친 값 보존).
- 결과적으로 이 함수는 "새 장소 추가 전용"에 가깝다.
  lat/lng 정정이나 이름 변경 같은 업데이트는 추후 별도 파이프라인에서 다룬다.
"""

from __future__ import annotations

import os
from typing import Callable, Dict, List, Optional

from supabase import create_client


ALLOWED_COLUMNS = {"name", "address", "lat", "lng", "brand", "source", "verified"}


def _client():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise RuntimeError(
            "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수를 설정해주세요."
        )
    return create_client(url, key)


def upsert_shops(shops: List[Dict], *, dry_run: bool = False) -> int:
    """shops 리스트를 Supabase에 upsert (ignore duplicates).

    Args:
        shops: 삽입할 shop 딕셔너리 리스트. ALLOWED_COLUMNS 외 키는 제거됨.
        dry_run: True면 DB에 쓰지 않고 카운트만 반환.

    Returns:
        실제로 DB에 전송된(=insert 시도된) 레코드 수.
    """
    if not shops:
        print("[storage] 저장할 샵 없음")
        return 0

    rows = [_sanitize(s) for s in shops]
    rows = [r for r in rows if r]

    if dry_run:
        print(f"[storage] DRY-RUN: {len(rows)}건 (DB에 쓰지 않음)")
        for i, r in enumerate(rows, start=1):
            brand = f" [{r['brand']}]" if r.get("brand") else ""
            print(f"  {i:>3}. {r['name']}{brand} | {r['address']}")
        return len(rows)

    client = _client()
    # ignore_duplicates=True → 기존 행은 건드리지 않고 새 행만 추가.
    # 사람이 verified 로 승격한 데이터를 크롤러가 되돌리지 못하게 막는다.
    client.table("shops").upsert(
        rows,
        on_conflict="name,address",
        ignore_duplicates=True,
    ).execute()
    print(f"[storage] upsert 요청 완료: {len(rows)}건")
    return len(rows)


def _sanitize(shop: Dict) -> Dict:
    """허용된 컬럼만 남기고, 필수 필드가 비어 있으면 폐기."""
    cleaned = {k: v for k, v in shop.items() if k in ALLOWED_COLUMNS}
    if not cleaned.get("name") or not cleaned.get("address"):
        return {}
    if cleaned.get("lat") is None or cleaned.get("lng") is None:
        return {}
    cleaned.setdefault("verified", False)
    return cleaned


def backfill_brands(
    detect: Callable[[str], Optional[str]],
    *,
    dry_run: bool = False,
) -> int:
    """`brand IS NULL` 인 행의 이름에서 브랜드를 재탐지해 업데이트.

    - 수동으로 brand를 채워둔 행은 건드리지 않는다 (조건: brand is null).
    - detect 함수는 이름을 받아 브랜드 문자열 또는 None을 반환한다.

    Returns:
        업데이트된 행 수.
    """
    client = _client()
    res = (
        client.table("shops")
        .select("id,name,brand")
        .is_("brand", "null")
        .execute()
    )
    rows = res.data or []
    print(f"[backfill] brand=NULL 인 행 {len(rows)}건 스캔")

    updates: List[Dict] = []
    for row in rows:
        brand = detect(row.get("name") or "")
        if brand:
            updates.append({"id": row["id"], "name": row["name"], "brand": brand})

    print(f"[backfill] 탐지된 브랜드 있음: {len(updates)}건")
    for u in updates[:10]:
        print(f"  - {u['name']} → {u['brand']}")
    if len(updates) > 10:
        print(f"  ... 외 {len(updates) - 10}건")

    if dry_run:
        print("[backfill] DRY-RUN: DB에 쓰지 않음")
        return len(updates)

    # 행마다 개별 update (Supabase Python SDK는 bulk update가 불편해서 단건 루프)
    written = 0
    for u in updates:
        client.table("shops").update({"brand": u["brand"]}).eq("id", u["id"]).execute()
        written += 1
    print(f"[backfill] 업데이트 완료: {written}건")
    return written
