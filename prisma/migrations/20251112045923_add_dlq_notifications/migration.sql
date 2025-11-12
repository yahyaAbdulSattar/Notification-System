-- CreateTable
CREATE TABLE "DlqNotification" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DlqNotification_pkey" PRIMARY KEY ("id")
);
