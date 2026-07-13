"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";

// 이름만으로 로그인. 이름 기준 upsert(있으면 로그인, 없으면 생성). 비밀번호 없음 (ADR 0003).
export async function login(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim().slice(0, 20);
  if (!name) return;

  const user = await prisma.user.upsert({
    where: { name },
    update: {},
    create: { name },
  });

  await createSession(user.id);

  // 초대 링크 등에서 온 경우 원래 목적지로 복귀 (오픈 리다이렉트 방지: 내부 경로만.
  // "//host"와 "/\host"는 브라우저가 외부 URL로 해석하므로 차단)
  const next = String(formData.get("next") ?? "");
  const safe = next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\");
  redirect(safe ? next : "/");
}

export async function logout() {
  await deleteSession();
  redirect("/");
}
