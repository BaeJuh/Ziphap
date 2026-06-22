-- 그룹 초대 코드 (README 슬라이스 2)
ALTER TABLE "Group" ADD COLUMN "inviteCode" TEXT NOT NULL;

CREATE UNIQUE INDEX "Group_inviteCode_key" ON "Group"("inviteCode");
