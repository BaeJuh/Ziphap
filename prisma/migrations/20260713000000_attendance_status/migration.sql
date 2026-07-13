-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('GOING', 'NOT_GOING');

-- AlterTable: 기존 행은 전부 참가였으므로 GOING이 사실과 일치
ALTER TABLE "Attendance" ADD COLUMN "status" "AttendanceStatus" NOT NULL DEFAULT 'GOING';
