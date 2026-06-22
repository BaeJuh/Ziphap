import "server-only";
import { cache } from "react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// 현재 로그인한 User (없으면 null). 한 요청 내 중복 호출은 cache로 1회만 조회.
export const getUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.userId } });
});
