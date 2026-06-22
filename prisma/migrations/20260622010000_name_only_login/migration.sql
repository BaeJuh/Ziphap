-- 이름만 로그인 (ADR 0003): email 선택화 + name 유니크
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

CREATE UNIQUE INDEX "User_name_key" ON "User"("name");
