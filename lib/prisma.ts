import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7은 driver adapter 필수 (쿼리 엔진 바이너리 없음). PrismaPg로 Postgres 연결.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// dev에서 hot reload마다 새 클라이언트 생성되는 것 방지 (싱글톤).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
