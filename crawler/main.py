"""가챠샵 크롤러 엔트리포인트.

사용법:
    python crawler/main.py                    # 카카오 로컬 API 수집 → Supabase upsert
    python crawler/main.py --dry-run          # Supabase에 쓰지 않고 결과만 출력
    python crawler/main.py --source kakao     # 특정 소스만 실행
    python crawler/main.py --backfill-brands  # 기존 행의 brand(NULL) 재탐지 업데이트

환경변수:
    KAKAO_REST_API_KEY        — 카카오 로컬 REST API 키
    SUPABASE_URL              — Supabase 프로젝트 URL
    SUPABASE_SERVICE_ROLE_KEY — Supabase service role 키 (쓰기 권한)
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Callable, Dict, List

from dotenv import load_dotenv

from sources import kakao
from sources.kakao import dedupe_by_name_address, detect_brand
from storage import backfill_brands, upsert_shops


SOURCES: Dict[str, Callable[[], List[Dict]]] = {
    "kakao": kakao.crawl,
    # "naver": naver.crawl,       # TODO: Playwright 기반 보조 소스
    # "instagram": instagram.crawl,
}


def _load_env() -> None:
    """프로젝트 루트의 .env, .env.local 을 순서대로 로드."""
    root = Path(__file__).resolve().parent.parent
    for name in (".env", ".env.local"):
        path = root / name
        if path.exists():
            load_dotenv(path, override=False)


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="가챠샵 크롤러")
    parser.add_argument(
        "--source",
        choices=sorted(SOURCES.keys()) + ["all"],
        default="all",
        help="실행할 소스 (기본값: all)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="DB에 쓰지 않고 수집 결과만 출력",
    )
    parser.add_argument(
        "--backfill-brands",
        action="store_true",
        help="수집은 건너뛰고, 기존 DB 행의 brand(NULL) 를 이름에서 재탐지해 채움",
    )
    return parser.parse_args()


def main() -> int:
    _load_env()
    args = _parse_args()

    if args.backfill_brands:
        backfill_brands(detect_brand, dry_run=args.dry_run)
        return 0

    targets = SOURCES.keys() if args.source == "all" else [args.source]

    collected: List[Dict] = []
    for name in targets:
        print(f"\n=== source: {name} ===")
        try:
            shops = SOURCES[name]()
        except Exception as e:
            print(f"[{name}] 수집 중 오류: {e}", file=sys.stderr)
            continue
        collected.extend(shops)

    # name+address 기준으로 다중 소스 결과 중복 제거
    before = len(collected)
    collected = dedupe_by_name_address(collected)
    print(f"\n[dedupe] {before}건 → {len(collected)}건")

    upsert_shops(collected, dry_run=args.dry_run)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
