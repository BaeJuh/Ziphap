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
  const user = await getUser();

  // 로그인 전에는 그룹 정보(이름·멤버수)나 코드 유효성을 노출하지 않는다
  // (미인증 열거·정보노출 방지). 이름 입력 후 이 페이지로 복귀해 참가.
  if (!user) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
        <div className="text-center">
          <p className="text-sm text-muted">초대받은 그룹</p>
          <h1 className="mt-1 text-2xl font-bold">집합에 초대받았어요</h1>
          <p className="mt-1 text-xs text-muted">이름을 입력하면 참가할 수 있어요</p>
        </div>

        <form action={login} className="flex w-full max-w-xs flex-col gap-3">
          <input type="hidden" name="next" value={`/join/${code}`} />
          <input
            name="name"
            placeholder="이름을 입력하면 참가"
            required
            maxLength={20}
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
      </main>
    );
  }

  const group = await prisma.group.findUnique({
    where: { inviteCode: code },
    include: { _count: { select: { memberships: true } } },
  });
  if (!group) notFound();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <p className="text-sm text-muted">초대받은 그룹</p>
        <h1 className="mt-1 text-2xl font-bold">{group.name}</h1>
        <p className="mt-1 text-xs text-muted">멤버 {group._count.memberships}명</p>
      </div>

      <form action={joinGroup} className="w-full max-w-xs">
        <input type="hidden" name="code" value={code} />
        <button
          type="submit"
          className="w-full rounded-lg bg-accent py-3 font-extrabold text-white transition-opacity hover:opacity-90"
        >
          <span className="font-semibold">{user.name}</span>(으)로 참가하기
        </button>
      </form>
    </main>
  );
}
