# 집합 — 문서

프로젝트 문서 모음. 기획 전반은 루트 [README.md](../README.md), 에이전트 규칙은 루트 [AGENTS.md](../AGENTS.md).

## 목차

- **[PROGRESS.md](PROGRESS.md)** — 진행 기록. **다음 세션은 이 문서부터 읽고 재개.**
- **[DEPLOY.md](DEPLOY.md)** — Railway 배포 가이드 (빌드/실행 스크립트·환경변수·절차)
- **[adr/](adr/)** — 아키텍처 결정 기록 (ADR)

## ADR 목록

| # | 결정 |
|---|---|
| [0001](adr/0001-monolithic-nextjs-railway.md) | 모놀리식 Next.js + Railway 올인원 호스팅 |
| [0002](adr/0002-postgres-everywhere.md) | DB 전 환경 Postgres 통일 |
| [0003](adr/0003-db-credentials-auth.md) | 경량 자작 쿠키 세션 인증 (이름만, 비번 없음) |
| [0004](adr/0004-binary-attendance-date-only.md) | 이진 Attendance + 날짜만 저장 |
| [0005](adr/0005-rolling-4week-calendar.md) | 캘린더: 오늘부터 4주 롤링 |
