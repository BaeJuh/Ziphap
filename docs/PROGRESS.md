# 진행 기록 (PROGRESS)

> 다음 세션에 이 문서부터 읽고 재개. 기획 전반은 [README.md](../README.md), 결정은 [adr/](adr/), 배포는 [DEPLOY.md](DEPLOY.md).

## 현재 상태 (2026-06-22)

**MVP 기능 완성 (Slice 1~5 전부). 프로덕션 빌드 검증됨. 아직 git 커밋·배포 안 함.**

핵심 루프가 다 동작: **이름 로그인 → 그룹 생성/초대 → 약속("집합") 띄우기 → 참가 토글.** 다크/라이트 테마, 모바일 바텀시트, 커스텀 드롭다운, 모션까지 적용.

| 슬라이스 | 상태 |
|---|---|
| 1. 걸어다니는 골격 (로그인→그룹→캘린더) | ✅ |
| 2. 초대 링크/코드로 참가 | ✅ |
| 3. 약속 띄우기 (날짜→폼→표시) | ✅ |
| 4. 참가 토글 + 참가자 아바타 | ✅ |
| 5. 모바일 마감 (테마토글·바텀시트·드롭다운·모션) | ✅ |

> 빌드 순서는 1 → (2 건너뛰고) 3 → 2 → 4 → 5 로 진행됨.

## 다음 할 일

1. **git 커밋 + 푸시** (현재 최초 커밋 1개뿐, 작업 전부 미커밋).
2. **Railway 배포** — [DEPLOY.md](DEPLOY.md) 참고. Postgres 플러그인 + `SESSION_SECRET` 설정.
3. 배포 후 도메인에서 전체 흐름 확인.

남은 다듬기(선택): 월 이동은 4주 롤링으로 대체했으므로 불필요([ADR 0005](adr/0005-rolling-4week-calendar.md)). 추가 기능은 README "MVP 제외(백로그)" 참고.

## 구현 맵 (파일)

- **인증** ([ADR 0003](adr/0003-db-credentials-auth.md)) — `lib/session.ts`(jose 쿠키), `lib/dal.ts`(`getUser`), `app/actions/auth.ts`(`login`/`logout`). 이름만 입력, 비번·이메일 없음.
- **DB** — `prisma/schema.prisma`(5모델), `lib/prisma.ts`(PrismaPg 어댑터 싱글톤), `docker-compose.yml`(로컬 Postgres).
- **그룹/초대** — `app/actions/group.ts`(`createGroup`/`joinGroup`), `app/join/[code]/page.tsx`, `app/groups/[id]/invite-link.tsx`.
- **약속/참가** — `app/actions/hangout.ts`(`createHangout`/`toggleAttendance`), `app/groups/[id]/group-calendar.tsx`(캘린더+바텀시트+생성시트, 클라이언트).
- **캘린더** ([ADR 0005](adr/0005-rolling-4week-calendar.md)) — `lib/calendar.ts`(오늘부터 4주, Asia/Seoul 기준·UTC 산술). 칸=띄운 사람 이니셜 아바타(내가 가는 약속은 초록), 전체는 날짜 탭→바텀시트 목록.
- **디자인** — `app/globals.css`(토큰 + night/clean 테마 + 키프레임/스크롤바), `app/theme-toggle.tsx`, `app/groups/[id]/group-switcher.tsx`, `app/layout.tsx`(430px 프레임).

## ⚠️ 함정 (다음 세션 주의)

1. **Prisma 7.8** (학습데이터 6.x와 다름): generator가 `prisma-client`(ESM) → 클라이언트가 `app/generated/prisma`에 **TS 소스로 생성**(gitignore, clone 후 `prisma generate` 필요). datasource에 `url` 없음 → `prisma.config.ts`가 dotenv로 `DATABASE_URL` 주입. **driver adapter 필수**(`@prisma/adapter-pg`). `migrate dev`가 클라이언트 자동생성 안 함 → `prisma generate` 별도.
2. **스키마 변경 후 dev 서버 재시작** — `migrate`/`generate` 해도 실행 중 dev가 옛 Prisma Client를 메모리 캐시(싱글톤이 HMR 넘어 유지) → "Unknown argument" 에러. 재시작 필요.
3. **Turbopack stale CSS** — `globals.css`(토큰/테마/키프레임) 바꿔도 dev가 옛 CSS 청크 제공 → **`.next` 삭제 후 재시작**해야 반영.
4. **마이그레이션 비대화형** — `migrate dev`가 unique 제약 등 경고 시 프롬프트 → 비대화형 환경에서 실패. 마이그레이션 SQL 직접 작성 후 `migrate deploy`로 적용함(`prisma/migrations/` 참고).

## 로컬 개발

```bash
docker compose up -d          # 로컬 Postgres (ziphap-db, localhost:5432)
npm run dev                   # http://localhost:3000
# 스키마 변경 시:
npx prisma migrate deploy     # 또는 SQL 수기작성(위 함정 4)
npx prisma generate           # 후 dev 재시작(함정 2)
docker compose down           # 정지 (데이터는 ziphap-pgdata 볼륨 유지)
```

`.env` 필요(gitignore됨): `DATABASE_URL`(docker Postgres), `SESSION_SECRET`(`openssl rand -base64 32`).

## 환경 메모

- Node v22.19 / npm 10.9 / git 2.51 / Docker 28.5.1(데몬 평소 꺼짐) / 로컬 psql 없음 / Railway CLI 미설치.
- 코드 작성 전 `node_modules/next/dist/docs/` 가이드 확인 (Next.js 16 breaking changes, AGENTS.md).
