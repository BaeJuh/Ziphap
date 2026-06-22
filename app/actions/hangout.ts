"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
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
  const timeText = String(formData.get("timeText") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  if (!groupId || !date || !timeText) return { ok: false };

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

// 참가 토글 (이진, ADR 0004): Attendance 행 있으면 삭제(불참), 없으면 생성(참가).
export async function toggleAttendance(formData: FormData) {
  const user = await getUser();
  const hangoutId = String(formData.get("hangoutId") ?? "");
  if (!user || !hangoutId) return;

  const hangout = await prisma.hangout.findUnique({ where: { id: hangoutId } });
  if (!hangout) return;

  // 그룹 멤버만 참가 가능
  const membership = await prisma.membership.findUnique({
    where: { userId_groupId: { userId: user.id, groupId: hangout.groupId } },
  });
  if (!membership) return;

  const existing = await prisma.attendance.findUnique({
    where: { hangoutId_userId: { hangoutId, userId: user.id } },
  });

  if (existing) {
    await prisma.attendance.delete({ where: { id: existing.id } });
  } else {
    await prisma.attendance.create({ data: { hangoutId, userId: user.id } });
  }

  revalidatePath(`/groups/${hangout.groupId}`);
}
