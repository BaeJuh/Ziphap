# 진행 기록 (PROGRESS)

> 다음 세션에 이 문서부터 읽고 재개. 기획 전반은 [README.md](../README.md), 결정은 [adr/](adr/), 배포는 [DEPLOY.md](DEPLOY.md).

## 현재 상태 (2026-06-25)

**MVP 완성 + 배포 전 코드리뷰 반영 + Railway 배포 완료. `/admin` 운영 현황 추가.**

핵심 루프가 다 동작: **이름 로그인 → 그룹 생성/초대 → 약속("집합") 띄우기 → 참가 토글.** 다크/라이트 테마, 모바일 바텀시트, 커스텀 드롭다운, 모션까지 적용. GitHub `main` 푸시 완료, Railway(앱 컨테이너 + Postgres) 배포됨 — 환경변수 `DATABASE_URL`·`SESSION_SECRET`·`ADMIN_NAMES` 설정.

### 배포 전 코드리뷰 반영 (보안+정확성, 커밋 `72d6876`)

- **참가 토글 레이스** (`app/actions/hangout.ts`): 더블탭/동시요청 시 `P2002`(중복생성)·`P2025`(삭제됨) 무해 케이스 흡수, 그 외만 throw → unhandled 500 방지.
- **초대 라우트 정보노출** (`app/join/[code]/page.tsx`): 로그인 전 그룹명·멤버수·코드 유효성 비공개(미인증 열거 차단).
- **생성 실패 피드백** (`group-calendar.tsx`): `createHangout` 실패 시 시트에 에러 표시.
- 미반영(인지): `SESSION_SECRET` fail-fast 가드(jose가 HS256 최소 키 길이를 강제해 미설정 시 로그인에서 즉시 터짐 — 조용한 약화 없음, 스킵 유지), 토글 실패 피드백. 캘린더 날짜 로직·인가(IDOR)는 견고 확인됨.

### 2차 심층 검토 반영 (2026-07-13)

전체 코드 재검토 + 빌드/린트 검증. 발견 4건 모두 수정:

- **오픈 리다이렉트 `//` 우회** (`app/actions/auth.ts`): `//host`·`/\host`(프로토콜 상대 URL) 차단.
- **`joinGroup` 초대코드 기반으로 변경** (`app/actions/group.ts`, `app/join/[code]/page.tsx`): 기존엔 hidden `groupId`를 코드 재검증 없이 upsert → 액션 직접 호출로 초대 없이 가입 가능했음. 이제 `code`를 받아 서버에서 조회.
- **입력 길이 제한**: 이름 20 / 그룹명 30 / timeText 50 / note 100. 서버 `.slice()` + 클라이언트 `maxLength` 동일 값.
- **`createHangout` date 형식 검증**: `YYYY-MM-DD` 정규식 — 조작 요청의 Invalid Date → 500 방지.

린트에 `theme-toggle.tsx` `set-state-in-effect` 에러 2건 남음 — 하이드레이션 후 테마 동기화용 의도된 패턴, Next 16은 빌드 시 린트 안 돌려 배포 무관. 추후 `useSyncExternalStore`로 정리 가능(백로그).

### "안함" 응답 추가 (2026-07-13, [ADR 0006](adr/0006-attendance-status.md))

이진 참가를 3상태(참가/안함/무반응)로 개정. `Attendance.status` enum(`GOING`|`NOT_GOING`, 기본 GOING) + 마이그레이션 `20260713000000_attendance_status`(수기 SQL). `toggleAttendance` → `setAttendance(hangoutId, status)` — 같은 버튼 재탭 시 해제. UI는 카드에 "참가 | 안함" 두 버튼, 안함은 `안함 N` 카운트만(이름 비노출, 압박 최소화), 무반응자 비표시.

| 슬라이스 | 상태 |
|---|---|
| 1. 걸어다니는 골격 (로그인→그룹→캘린더) | ✅ |
| 2. 초대 링크/코드로 참가 | ✅ |
| 3. 약속 띄우기 (날짜→폼→표시) | ✅ |
| 4. 참가 토글 + 참가자 아바타 | ✅ |
| 5. 모바일 마감 (테마토글·바텀시트·드롭다운·모션) | ✅ |

> 빌드 순서는 1 → (2 건너뛰고) 3 → 2 → 4 → 5 로 진행됨.

## 다음 할 일

커밋·푸시·배포 완료. 남은 건 **라이브 도메인에서 전체 흐름 최종 확인**(로그인→그룹→약속→참가→초대, `/admin`).

**백로그 (공개 확장 시):**

1. **인증 정식화** — 현재 이름-only(비번 없음, 사칭 가능, ADR 0003). 지인 소수에선 OK. 공개 확장 시 OAuth(카카오/구글) + User `isAdmin`/role로.
2. **`/admin` 인증 승격** — 현재 `ADMIN_NAMES` 이름 게이트인데 이름-only라 "admin"은 추측 가능(임시). 별도 비번 쿠키 또는 `isAdmin` 플래그로 교체.
3. 그 외: 토글 실패 피드백, `theme-toggle` 린트 정리(`useSyncExternalStore`), README "MVP 제외(백로그)".

남은 다듬기: 월 이동은 4주 롤링으로 대체했으므로 불필요([ADR 0005](adr/0005-rolling-4week-calendar.md)).

## 구현 맵 (파일)

- **인증** ([ADR 0003](adr/0003-db-credentials-auth.md)) — `lib/session.ts`(jose 쿠키), `lib/dal.ts`(`getUser`), `app/actions/auth.ts`(`login`/`logout`). 이름만 입력, 비번·이메일 없음.
- **DB** — `prisma/schema.prisma`(5모델), `lib/prisma.ts`(PrismaPg 어댑터 싱글톤), `docker-compose.yml`(로컬 Postgres).
- **그룹/초대** — `app/actions/group.ts`(`createGroup`/`joinGroup`), `app/join/[code]/page.tsx`, `app/groups/[id]/invite-link.tsx`.
- **약속/참가** — `app/actions/hangout.ts`(`createHangout`/`setAttendance` — 참가/안함/해제, ADR 0006), `app/groups/[id]/group-calendar.tsx`(캘린더+바텀시트+생성시트, 클라이언트).
- **캘린더** ([ADR 0005](adr/0005-rolling-4week-calendar.md)) — `lib/calendar.ts`(오늘부터 4주, Asia/Seoul 기준·UTC 산술). 칸=띄운 사람 이니셜 아바타(내가 가는 약속은 초록), 전체는 날짜 탭→바텀시트 목록.
- **디자인** — `app/globals.css`(토큰 + night/clean 테마 + 키프레임/스크롤바), `app/theme-toggle.tsx`, `app/groups/[id]/group-switcher.tsx`, `app/layout.tsx`(430px 프레임).
- **운영 현황** — `app/admin/page.tsx`(읽기 전용). `ADMIN_NAMES`(쉼표구분 이름) 허용목록 게이트 → 비admin·미설정은 `notFound`(fail-closed). 요약수치(유저·그룹·약속·참가)·그룹별 멤버/약속수·최근 약속 8개. UI에 링크 없는 숨은 라우트. 인증은 임시(위 백로그 2).

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
