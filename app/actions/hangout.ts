"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { getUser } from "@/lib/dal";

// 약속("집합") 띄우기. date는 "YYYY-MM-DD"(날짜만, ADR 0004). 멤버만 가능.
// useActionState 시그니처: (이전상태, formData) → 결과.
export async function createHangout(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: boolean }> {
  const user = await getUser();
  if (!user) return { ok: false };

  const groupId = String(formData.get("groupId") ?? "");
  const date = String(formData.get("date") ?? "");
  const timeText = String(formData.get("timeText") ?? "").trim().slice(0, 50);
  const note = String(formData.get("note") ?? "").trim().slice(0, 100);
  if (!groupId || !timeText) return { ok: false };
  // 정상 UI는 항상 유효한 값을 보냄 — 조작된 요청의 Invalid Date → Prisma throw 방지
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false };

  const membership = await prisma.membership.findUnique({
    where: { userId_groupId: { userId: user.id, groupId } },
  });
  if (!membership) return { ok: false };

  await prisma.hangout.create({
    data: {
      groupId,
      creatorId: user.id,
      date: new Date(`${date}T00:00:00.000Z`),
      timeText,
      note,
    },
  });

  revalidatePath(`/groups/${groupId}`);
  return { ok: true };
}

// 참가 응답 (ADR 0004→0006): 참가/안함 중 하나를 선택, 같은 걸 다시 누르면 해제(무반응).
// 행 존재 = 응답(status), 없음 = 무반응.
export async function setAttendance(formData: FormData) {
  const user = await getUser();
  const hangoutId = String(formData.get("hangoutId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!user || !hangoutId) return;
  if (status !== "GOING" && status !== "NOT_GOING") return;

  const hangout = await prisma.hangout.findUnique({ where: { id: hangoutId } });
  if (!hangout) return;

  // 그룹 멤버만 응답 가능
  const membership = await prisma.membership.findUnique({
    where: { userId_groupId: { userId: user.id, groupId: hangout.groupId } },
  });
  if (!membership) return;

  const existing = await prisma.attendance.findUnique({
    where: { hangoutId_userId: { hangoutId, userId: user.id } },
  });

  // 더블탭/동시요청 레이스: 둘 다 create → P2002, 둘 다 delete → P2025.
  // 원하는 최종 상태는 이미 만족되므로 무해, 흡수한다.
  try {
    if (existing?.status === status) {
      await prisma.attendance.delete({ where: { id: existing.id } });
    } else {
      await prisma.attendance.upsert({
        where: { hangoutId_userId: { hangoutId, userId: user.id } },
        update: { status },
        create: { hangoutId, userId: user.id, status },
      });
    }
  } catch (e) {
    if (
      !(e instanceof Prisma.PrismaClientKnownRequestError) ||
      !["P2002", "P2025"].includes(e.code)
    ) {
      throw e;
    }
  }

  revalidatePath(`/groups/${hangout.groupId}`);
}
