"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/dal";

// 그룹 생성 + 생성자를 멤버로 자동 가입 (nested write로 한 번에). 초대코드도 함께 생성.
export async function createGroup(formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/");

  const name = String(formData.get("name") ?? "").trim().slice(0, 30);
  if (!name) return;

  const group = await prisma.group.create({
    data: {
      name,
      inviteCode: randomBytes(5).toString("hex"), // 10자리 hex
      memberships: { create: { userId: user.id } },
    },
  });

  redirect(`/groups/${group.id}`);
}

// 초대코드로 그룹 가입. 이미 멤버면 멱등(no-op) 후 그룹으로 이동.
// groupId가 아닌 코드를 받는다 — 코드를 아는 사람만 가입 가능해야 하므로 (액션 직접 호출 방어).
export async function joinGroup(formData: FormData) {
  const user = await getUser();
  const code = String(formData.get("code") ?? "");
  if (!user || !code) redirect("/");

  const group = await prisma.group.findUnique({ where: { inviteCode: code } });
  if (!group) redirect("/");

  await prisma.membership.upsert({
    where: { userId_groupId: { userId: user.id, groupId: group.id } },
    update: {},
    create: { userId: user.id, groupId: group.id },
  });

  redirect(`/groups/${group.id}`);
}

// 그룹 나가기. 내 참가 응답은 정리하고(나간 사람이 "참가중"으로 남지 않게),
// 내가 띄운 집합은 유지(다른 멤버가 참가 중일 수 있음 — 재가입 시 그대로).
export async function leaveGroup(formData: FormData) {
  const user = await getUser();
  const groupId = String(formData.get("groupId") ?? "");
  if (!user || !groupId) return;

  // deleteMany: 이미 나갔거나 멤버가 아니어도 무해(count 0). 한 트랜잭션 = 왕복 1회 + 원자성.
  await prisma.$transaction([
    prisma.attendance.deleteMany({
      where: { userId: user.id, hangout: { groupId } },
    }),
    prisma.membership.deleteMany({
      where: { userId: user.id, groupId },
    }),
  ]);

  redirect("/");
}
