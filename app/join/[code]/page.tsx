import { notFound } from "next/navigation";
import { getUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { login } from "@/app/actions/auth";
import { joinGroup } from "@/app/actions/group";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const group = await prisma.group.findUnique({
    where: { inviteCode: code },
    include: { _count: { select: { memberships: true } } },
  });
  if (!group) notFound();

  const user = await getUser();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <p className="text-sm text-muted">초대받은 그룹</p>
        <h1 className="mt-1 text-2xl font-bold">{group.name}</h1>
        <p className="mt-1 text-xs text-muted">멤버 {group._count.memberships}명</p>
      </div>

      {user ? (
        // 로그인 상태 → 바로 참가
        <form action={joinGroup} className="w-full max-w-xs">
          <input type="hidden" name="groupId" value={group.id} />
          <button
            type="submit"
            className="w-full rounded-lg bg-accent py-3 font-extrabold text-white transition-opacity hover:opacity-90"
          >
            <span className="font-semibold">{user.name}</span>(으)로 참가하기
          </button>
        </form>
      ) : (
        // 로그아웃 상태 → 이름 입력 후 이 페이지로 복귀
        <form action={login} className="flex w-full max-w-xs flex-col gap-3">
          <input type="hidden" name="next" value={`/join/${code}`} />
          <input
            name="name"
            placeholder="이름을 입력하면 참가"
            required
            autoFocus
            className="rounded-lg border border-line bg-card px-4 py-3 text-txt placeholder:text-muted/60 focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-accent py-3 font-extrabold text-white transition-opacity hover:opacity-90"
          >
            참가하기
          </button>
        </form>
      )}
    </main>
  );
}
