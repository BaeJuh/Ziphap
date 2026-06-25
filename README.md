# 집합 (ziphap)

캐주얼 그룹 모임 캘린더 — **"나 이날 놀고 싶어" 보드.**

그룹원이 캘린더에 약속 제안("금요일 7시 퇴근후 한잔ㄱ?")을 가볍게 띄우면, 나머지가 "참가"를 누르거나 그냥 무시한다. Doodle/when2meet 같은 격식 있는 일정조율이 아니라, 부담 없는 **"놀자 띄우기"**가 차별점.

## 스택

- **Next.js 16 (App Router) + TypeScript** — 프론트+백 한 덩어리(모놀리식, [ADR 0001](docs/adr/0001-monolithic-nextjs-railway.md))
- **Tailwind CSS v4**
- **Prisma 7 + Postgres** — 전 환경 Postgres 통일(로컬 Docker / 배포 Railway, [ADR 0002](docs/adr/0002-postgres-everywhere.md))
- **경량 자작 쿠키 세션 (jose)** — 이름만 입력, 비번·이메일 없음. Auth.js/OAuth는 백로그 ([ADR 0003](docs/adr/0003-db-credentials-auth.md))

> ⚠️ Next.js 16은 breaking changes가 있음. 코드 작성 전 `node_modules/next/dist/docs/` 가이드 확인 (repo의 `AGENTS.md` 참고).

## 데이터 모델 (5개, 최소주의)

```
User ─(Membership)─ Group ─1:N─ Hangout ─1:N─ Attendance
```

- **Group**: `name`, `inviteCode`(고유 — 초대 링크/코드)
- **Hangout**: `groupId`, `creatorId`, `date`(날짜만), `timeText`(자유텍스트 "퇴근후"), `note`(한 줄)
- **Attendance**: 행 존재 = 참가 / 없음 = 무반응 (**이진 — `status` 컬럼 없음**, [ADR 0004](docs/adr/0004-binary-attendance-date-only.md))
- `date`만 저장(시간은 자유 텍스트) → 타임존 회피

## 빌드 슬라이스 (전부 완료 ✅)

1. ✅ **걸어다니는 골격**: 로그인 → 그룹 생성 → 빈 캘린더
2. ✅ 초대 링크/코드로 참가
3. ✅ 약속 제안 띄우기 (날짜 클릭 → 폼 → 캘린더 표시)
4. ✅ 참가 반응 토글 + 참가자 표시
5. ✅ 모바일 우선 반응형 마감 (테마 토글·바텀시트·드롭다운·모션)

> MVP 완성 + 배포 전 코드리뷰 반영 + **Railway 배포 완료**. 읽기 전용 운영 현황 `/admin` 추가(임시 인증). 진행기록 → [docs/PROGRESS.md](docs/PROGRESS.md), [docs/DEPLOY.md](docs/DEPLOY.md).

**MVP 제외(백로그)**: "이날 불가" 표시, 알림, 참가 중간상태, 반복모임, 댓글, 사진, PWA.

## 디자인 방향

- 2테마 토글: night(다크 기본) ↔ clean(라이트). 로고 옆 스위치.
- 캘린더: **오늘부터 4주 롤링**, **월요일 시작**, 토=파랑 / 일=빨강 ([ADR 0005](docs/adr/0005-rolling-4week-calendar.md)). 모바일 7열은 폭이 좁아 칸 안엔 **띄운 사람 이니셜 아바타**(원, 2개 + "+N" — 글자수·폭에 안 흔들림), 전체 내용은 날짜 탭 시 아래 목록 카드에. 그리드=개요, 목록=읽기(점진적 공개). (프로토타입의 `minmax(auto,1fr)` 유동 그리드는 모바일에서 텍스트가 잘리고 가로 넘침 → 표준 패턴인 인디케이터+목록으로 대체)
- 무채색 90% + 포인트색 1개(빨강 계열). 둥글기는 절제(균일하게 둥근 게 "AI 느낌"의 주범).
- 느낌 확인용 단일 HTML 프로토타입: `../prototype.html`

## 로컬 실행

```bash
npm install
docker compose up -d          # 로컬 Postgres (ziphap-db, localhost:5432)
# .env 생성: DATABASE_URL, SESSION_SECRET (아래)
npx prisma migrate deploy     # 스키마 적용
npx prisma generate           # Prisma Client 생성 (app/generated/, gitignore됨)
npm run dev                   # http://localhost:3000
```

`.env` (gitignore됨):

```
DATABASE_URL="postgresql://ziphap:ziphap@localhost:5432/ziphap?schema=public"
SESSION_SECRET="<openssl rand -base64 32 로 생성>"
```

> Prisma 7·Turbopack 관련 주의사항은 [docs/PROGRESS.md](docs/PROGRESS.md)의 "함정" 참고.

## 배포

Railway 올인원 — Next.js 앱 컨테이너 + Postgres 플러그인. 빌드/실행 스크립트·환경변수·절차는 **[docs/DEPLOY.md](docs/DEPLOY.md)**. (**배포 완료** — 앱+Postgres 가동, `DATABASE_URL`·`SESSION_SECRET`·`ADMIN_NAMES` 설정. 함정: Postgres 플러그인의 `DATABASE_URL`을 앱 서비스에 **참조 변수로 연결**해야 함.)
