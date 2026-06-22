import Link from "next/link";
import { getUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { login, logout } from "@/app/actions/auth";
import { createGroup } from "@/app/actions/group";
import ThemeToggle from "@/app/theme-toggle";

function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`font-extrabold tracking-tight ${className}`}>
      집합<span className="text-accent">!</span>
    </span>
  );
}

export default async function Home() {
  const user = await getUser();

  if (!user) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
        <div className="text-center">
          <Logo className="text-4xl" />
          <p className="mt-3 text-sm text-muted">나 이날 놀고 싶어 — 가볍게 띄우는 모임</p>
        </div>
        <form action={login} className="flex w-full max-w-xs flex-col gap-3">
          <input
            name="name"
            placeholder="이름만 입력하면 끝"
            required
            autoFocus
            className="rounded-lg border border-line bg-card px-4 py-3 text-txt placeholder:text-muted/60 focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-accent py-3 font-extrabold text-white transition-opacity hover:opacity-90"
          >
            시작하기
          </button>
        </form>
      </main>
    );
  }

  const groups = await prisma.group.findMany({
    where: { memberships: { some: { userId: user.id } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-line bg-bg/85 px-[18px] py-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <Logo className="text-[22px]" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <form action={logout}>
              <button type="submit" className="text-xs text-muted hover:text-txt">
                로그아웃
              </button>
            </form>
          </div>
        </div>
        <p className="mt-1 text-sm text-muted">
          안녕, <span className="font-semibold text-txt">{user.name}</span> 👋
        </p>
      </header>

      <main className="flex flex-1 flex-col gap-6 p-[18px]">
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold text-muted">내 그룹</h2>
          {groups.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              아직 그룹이 없어요. 아래에서 만들어보세요.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {groups.map((g) => (
                <li key={g.id}>
                  <Link
                    href={`/groups/${g.id}`}
                    className="block rounded-lg border border-line bg-card px-4 py-3 font-semibold transition-colors hover:border-muted"
                  >
                    {g.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <form action={createGroup} className="flex gap-2">
          <input
            name="name"
            placeholder="새 그룹 이름"
            required
            className="flex-1 rounded-lg border border-line bg-card px-4 py-3 text-txt placeholder:text-muted/60 focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-accent px-5 font-extrabold text-white transition-opacity hover:opacity-90"
          >
            만들기
          </button>
        </form>
      </main>
    </>
  );
}
