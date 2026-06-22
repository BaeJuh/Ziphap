# 아키텍처 결정 기록 (ADR)

프로젝트의 주요 기술 결정과 그 근거. 새 결정은 번호를 이어 추가하고, 기존 결정을 뒤집으면 새 ADR로 대체한다.

| # | 결정 | 상태 |
|---|---|---|
| [0001](0001-monolithic-nextjs-railway.md) | 모놀리식 Next.js + Railway 올인원 호스팅 | 채택 |
| [0002](0002-postgres-everywhere.md) | DB는 전 환경 Postgres 통일 (로컬 Docker / Railway 관리형) | 채택 |
| [0003](0003-db-credentials-auth.md) | 경량 자작 쿠키 세션 인증 (비밀번호 없음, OAuth 백로그) | 채택 |
| [0004](0004-binary-attendance-date-only.md) | 이진 Attendance + 날짜만 저장 데이터 모델 | 채택 |
| [0005](0005-rolling-4week-calendar.md) | 캘린더 표시 범위: 오늘부터 4주 롤링 | 채택 |
