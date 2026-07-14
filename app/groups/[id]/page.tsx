import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { getUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { buildCalendarWeeks, ymdDateOnly } from "@/lib/calendar";
import GroupCalendar, { type Hangout } from "./group-calendar";
import InviteLink from "./invite-link";
import GroupSwitcher from "./group-switcher";
import ThemeToggle from "@/app/theme-toggle";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect("/");

  // 멤버만 접근. 비멤버는 존재 여부도 노출하지 않도록 notFound.
  const membership = await prisma.membership.findUnique({
    where: { userId_groupId: { userId: user.id, groupId: id } },
    include: {
      group: { include: { _count: { select: { memberships: true } } } },
    },
  });
  if (!membership) notFound();

  const group = membership.group;

  // 초대 링크 절대 URL (배포 시 호스트 자동 반영)
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const inviteUrl = `${proto}://${h.get("host")}/join/${group.inviteCode}`;

  // 헤더 드롭다운용 내 그룹 목록
  const myGroups = await prisma.group.findMany({
    where: { memberships: { some: { userId: user.id } } },
    select: { id: true, name: true },
    orderBy: { createdAt: "desc" },
  });

  const days = buildCalendarWeeks().flat();
  const todayIso = days.find((d) => d.isToday)?.iso ?? days[0].iso;

  // 보이는 4주 범위의 약속만 조회 → 날짜별로 묶기
  const rows = await prisma.hangout.findMany({
    where: {
      groupId: id,
      date: {
        gte: new Date(`${days[0].iso}T00:00:00.000Z`),
        lte: new Date(`${days[days.length - 1].iso}T00:00:00.000Z`),
      },
    },
    orderBy: { createdAt: "asc" },
    include: {
      creator: { select: { name: true } },
      attendances: { include: { user: { select: { id: true, name: true } } } },
    },
  });

  const hangoutsByDate: Record<string, Hangout[]> = {};
  for (const r of rows) {
    const iso = ymdDateOnly(r.date);
    (hangoutsByDate[iso] ??= []).push({
      id: r.id,
      timeText: r.timeText,
      note: r.note,
      creatorName: r.creator.name,
      isMine: r.creatorId === user.id,
      attendees: r.attendances
        .filter((a) => a.status === "GOING")
        .map((a) => a.user.name),
      notGoingCount: r.attendances.filter((a) => a.status === "NOT_GOING").length,
      myStatus:
        r.attendances.find((a) => a.user.id === user.id)?.status ?? null,
    });
  }

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-line bg-bg/85 px-[18px] py-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xs text-muted hover:text-txt">
            <span className="relative -top-0.5">‹</span> 내 그룹
          </Link>
          <ThemeToggle />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <GroupSwitcher groups={myGroups} current={group.id} />
          <span className="text-xs text-muted">멤버 {group._count.memberships}명</span>
        </div>
        <div className="mt-2">
          <InviteLink url={inviteUrl} />
        </div>
      </header>

      <main className="flex-1 p-[14px] pb-[40vh]">
        <GroupCalendar
          groupId={group.id}
          days={days}
          hangoutsByDate={hangoutsByDate}
          todayIso={todayIso}
        />
      </main>
    </>
  );
}
