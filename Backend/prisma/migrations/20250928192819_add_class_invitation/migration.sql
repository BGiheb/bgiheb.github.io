-- CreateTable
CREATE TABLE "ClassInvitation" (
    "id" SERIAL NOT NULL,
    "classId" INTEGER NOT NULL,
    "invitedEmail" TEXT NOT NULL,
    "inviteToken" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClassInvitation_inviteToken_key" ON "ClassInvitation"("inviteToken");

-- AddForeignKey
ALTER TABLE "ClassInvitation" ADD CONSTRAINT "ClassInvitation_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
