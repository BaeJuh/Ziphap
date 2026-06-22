"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/dal";

// 그룹 생성 + 생성자를 멤버로 자동 가입 (nested write로 한 번에). 초대코드도 함께 생성.
export async function createGroup(formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/");

  const name = String(formData.get("name") ?? "").trim();
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

// 초대로 그룹 가입. 이미 멤버면 멱등(no-op) 후 그룹으로 이동.
export async function joinGroup(formData: FormData) {
  const user = await getUser();
  const groupId = String(formData.get("groupId") ?? "");
  if (!user || !groupId) redirect("/");

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) redirect("/");

  await prisma.membership.upsert({
    where: { userId_groupId: { userId: user.id, groupId } },
    update: {},
    create: { userId: user.id, groupId },
  });

  redirect(`/groups/${groupId}`);
}
