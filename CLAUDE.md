# 가챠맵 (Gacha Map) — CLAUDE.md

## 프로젝트 개요
국내 가챠샵(캡슐토이 판매점) 위치를 모아서 보여주는 웹 서비스.
크롤링으로 데이터를 자동 수집하고, 카카오맵 기반으로 시각화한다.

## 기술 스택
- Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS
- 지도: 카카오맵 JavaScript API
- DB: Supabase (PostgreSQL + PostGIS)
- 크롤링: Python 3.11, Playwright, BeautifulSoup4
- 배포: Vercel

## 핵심 원칙
- 컴포넌트는 단일 책임 원칙 준수
- 크롤러와 프론트엔드는 완전히 분리 (crawler/ 디렉토리)
- DB 스키마 변경 시 반드시 types/shop.ts 동기화
- 지도 관련 코드는 components/Map/ 에만 위치

## 데이터 모델 (shops 테이블)
- id, name, address, lat, lng
- brand (브랜드명: 가챠가챠, 扭蛋 등)
- source (크롤링 출처)
- verified (검수 여부)
- created_at, updated_at

## 주요 화면
1. 메인: 지도 + 주변 가챠샵 목록
2. 샵 상세: 위치, 운영시간, 브랜드 정보
3. (추후) 제보 폼

## 크롤링 전략
- 네이버 플레이스: "가챠" "캡슐토이" 키워드 검색
- 인스타그램 해시태그: #가챠샵 #캡슐토이
- 수집 후 Supabase에 upsert (중복 방지)

## 명령어
- `npm run dev` — 개발 서버
- `python crawler/main.py` — 크롤러 실행
- `npm run build` — 프로덕션 빌드