import { notFound } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { ymdDateOnly, ymdSeoul } from "@/lib/calendar";

// 읽기 전용 운영 현황. ADMIN_NAMES(쉼표구분 이름 목록)에 든 사용자만 접근.
// 미설정 시 목록이 비어 모두 notFound → fail-closed (admin 기본 차단).
function adminNames() {
  return (process.env.ADMIN_NAMES ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default async function AdminPage() {
  const user = await getUser();
  if (!user || !adminNames().includes(user.name)) notFound();

  const [users, groups, hangouts, attendances, groupRows, recent] =
    await Promise.all([
      prisma.user.count(),
      prisma.group.count(),
      prisma.hangout.count(),
      prisma.attendance.count(),
      prisma.group.findMany({
        select: {
          id: true,
          name: true,
          createdAt: true,
          _count: { select: { memberships: true, hangouts: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.hangout.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          group: { select: { name: true } },
          creator: { select: { name: true } },
          _count: { select: { attendances: true } },
        },
      }),
    ]);

  const stats = [
    { label: "유저", value: users },
    { label: "그룹", value: groups },
    { label: "약속", value: hangouts },
    { label: "참가", value: attendances },
  ];

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-line bg-bg/85 px-[18px] py-4 backdrop-blur">
        <Link href="/" className="text-xs text-muted hover:text-txt">
          <span className="relative -top-0.5">‹</span> 홈
        </Link>
        <h1 className="mt-2 text-lg font-bold">운영 현황</h1>
        <p className="text-xs text-muted">읽기 전용 · {user.name}</p>
      </header>

      <main className="flex-1 space-y-6 p-[14px] pb-24">
        {/* 요약 */}
        <div className="grid grid-cols-2 gap-2.5">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-line bg-card px-4 py-3.5"
            >
              <div className="text-xs text-muted">{s.label}</div>
              <div className="mt-1 text-2xl font-extrabold tabular-nums">
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* 그룹별 */}
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            그룹 {groupRows.length}
          </h2>
          {groupRows.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-muted">
              아직 그룹이 없어요.
            </p>
          ) : (
            <ul className="space-y-2">
              {groupRows.map((g) => (
                <li
                  key={g.id}
                  className="flex items-center justify-between rounded-lg border border-line bg-card px-3.5 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold">{g.name}</div>
                    <div className="text-[11px] text-muted">
                      {ymdSeoul(g.createdAt)} 생성
                    </div>
                  </div>
                  <div className="ml-3 flex shrink-0 gap-3 text-xs text-muted tabular-nums">
                    <span>멤버 {g._count.memberships}</span>
                    <span>약속 {g._count.hangouts}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 최근 약속 */}
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            최근 약속
          </h2>
          {recent.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-muted">
              아직 띄운 약속이 없어요.
            </p>
          ) : (
            <ul className="space-y-2">
              {recent.map((h) => (
                <li
                  key={h.id}
                  className="rounded-lg border border-line bg-card px-3.5 py-3"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-bold">
                      {h.timeText}
                    </span>
                    <span className="shrink-0 text-[11px] text-muted tabular-nums">
                      {ymdDateOnly(h.date)}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-muted">
                    {h.group.name} · {h.creator.name} 띄움 · 참가{" "}
                    {h._count.attendances}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
