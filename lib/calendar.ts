// 캘린더 그리드 생성 (ADR 0005). 오늘이 포함된 주의 월요일부터 N주.
// "오늘"은 Asia/Seoul 기준, 날짜 산술은 UTC로 처리해 타임존 드리프트 방지.

export type CalendarDay = {
  iso: string; // "2026-06-25"
  day: number; // 25
  isToday: boolean;
  weekday: number; // 0=월 … 5=토, 6=일
};

export function buildCalendarWeeks(weeks = 4): CalendarDay[][] {
  const todayIso = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
  }).format(new Date()); // "YYYY-MM-DD"

  const [ty, tm, td] = todayIso.split("-").map(Number);
  const today = new Date(Date.UTC(ty, tm - 1, td));

  // 이번 주 월요일 (일=0..토=6 → 월=0 기준 오프셋)
  const offset = (today.getUTCDay() + 6) % 7;
  const monday = new Date(today);
  monday.setUTCDate(today.getUTCDate() - offset);

  const result: CalendarDay[][] = [];
  for (let w = 0; w < weeks; w++) {
    const row: CalendarDay[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(monday);
      date.setUTCDate(monday.getUTCDate() + w * 7 + d);
      const iso = date.toISOString().slice(0, 10);
      row.push({ iso, day: date.getUTCDate(), isToday: iso === todayIso, weekday: d });
    }
    result.push(row);
  }
  return result;
}
