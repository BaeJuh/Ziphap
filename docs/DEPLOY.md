# 배포 (Railway)

올인원: Next.js 앱 컨테이너 1개 + Railway 관리형 Postgres ([ADR 0001](adr/0001-monolithic-nextjs-railway.md)).

## 빌드/실행 파이프라인 (package.json)

- **build**: `prisma generate && next build`
  - 생성된 Prisma Client(`app/generated/`)는 gitignore라 빌드 때 매번 generate 필요.
- **start**: `prisma migrate deploy && next start`
  - 배포된 마이그레이션을 DB에 적용 후 서버 시작. (마이그레이션 파일은 `prisma/migrations/`에 커밋됨)

> 빌드는 DB 없이 됨(모든 페이지가 `cookies()`/`headers()` 사용 → 동적, 빌드 시 DB 접근 안 함). DB는 런타임(start)에만 필요.

## 환경변수 (Railway에 설정 — `.env`는 gitignore, 커밋 안 됨)

| 변수 | 값 |
|---|---|
| `DATABASE_URL` | Railway Postgres 플러그인이 제공. 앱 서비스에서 해당 변수 참조. |
| `SESSION_SECRET` | **새로 생성** 후 설정: `openssl rand -base64 32` (로컬 값 재사용 금지). |

## 절차

1. **Railway 프로젝트 생성** → GitHub repo 연결(Next.js 자동 감지, Nixpacks 빌드) 또는 `railway up`.
2. **Postgres 플러그인 추가** (버튼). `DATABASE_URL` 자동 생성됨 → 앱 서비스 변수에 연결.
3. **`SESSION_SECRET`** 변수 추가(위 명령으로 생성한 값).
4. 배포 → start 시 `prisma migrate deploy`가 5개 테이블 + 이후 마이그레이션 적용.
5. 첫 배포 후 도메인 접속 → 이름 로그인 → 그룹 생성 → 초대 링크는 배포 호스트로 자동 생성(`headers()` 기반).

## 주의

- `provider = "postgresql"` 고정이라 로컬(Docker)·배포(Railway) DB 파리티 동일 ([ADR 0002](adr/0002-postgres-everywhere.md)). 마이그레이션 그대로 이식됨.
- 인증은 비번 없는 이름 로그인 ([ADR 0003](adr/0003-db-credentials-auth.md)) — 공개 배포 시 사칭 가능성 인지(지인 그룹 한정).
