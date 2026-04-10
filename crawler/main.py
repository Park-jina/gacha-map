"""가챠샵 크롤러 엔트리포인트.

사용법:
    python crawler/main.py
"""

from sources import naver, instagram
from storage import upsert_shops


def main() -> None:
    shops = []
    shops.extend(naver.crawl())
    shops.extend(instagram.crawl())
    upsert_shops(shops)


if __name__ == "__main__":
    main()
