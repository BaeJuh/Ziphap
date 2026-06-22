# ADR 0002 — DB는 전 환경 Postgres 통일 (로컬 Docker / Railway 관리형)

- 상태: 채택(Accepted)
- 날짜: 2026-06-22

## 맥락

초기 계획은 "로컬 SQLite → 배포 시 `DATABASE_URL`만 Postgres로 교체, 코드 변경 0"이었으나 Prisma에선 성립하지 않음:

- `datasource.provider`가 스키마에 **하드코딩 고정값**이라 env로 못 바꿈.
- 마이그레이션이 **provider별 SQL**로 생성됨 → SQLite 마이그레이션은 Postgres에 그대로 이식 불가(타입·문법 차이).

→ SQLite를 쓰면 배포 시 provider 변경 + 마이그레이션 재생성 + dev≠prod 차이 버그 위험.

## 결정

**모든 환경에서 Postgres를 사용**하고 `provider = "postgresql"` 하나로 고정한다.

- 로컬 개발: `docker-compose`로 띄운 Postgres 컨테이너 (Docker는 이미 설치됨, 사용 시 Docker Desktop 실행).
- 배포: Railway **관리형 Postgres 플러그인**. 로컬 docker-compose를 Railway에 올리는 게 아니라, `DATABASE_URL`만 Railway 것으로 교체.

## 결과

- 장점: dev=prod 파리티, provider 함정 원천 차단, 마이그레이션 그대로 이식.
- 단점: 로컬 개발 시 Docker Desktop 실행 필요.
- 기각: ②Railway PG 직결(인터넷 상시 필요 + dev DB 상시 과금), ③SQLite 유지(dev≠prod, 마이그레이션 재생성).
