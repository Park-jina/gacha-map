"""크롤링 결과를 Supabase에 upsert."""

import os
from typing import List, Dict

from supabase import create_client


def _client():
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)


def upsert_shops(shops: List[Dict]) -> None:
    if not shops:
        return
    client = _client()
    # name + address 조합으로 중복 방지
    client.table("shops").upsert(shops, on_conflict="name,address").execute()
