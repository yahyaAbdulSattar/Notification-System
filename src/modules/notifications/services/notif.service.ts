import { prisma } from "../../../config/prisma.js";
import { inc } from "../../../metrics/metrics.js";

export async function recordAttempt(notificationId: string, attemptNumber: number, result: string, error?: string) {
  inc("attempts_total", 1);
  await prisma.notificationAttempt.create({
    data: {
      notificationId,
      attemptNumber,
      result,
      error: error || null,
    },
  });

  // increment attemptsCount + set lastAttemptAt
  await prisma.notification.update({
    where: { id: notificationId },
    data: {
      attemptsCount: { increment: 1 },
      lastAttemptAt: new Date(),
      ...(result === "success" && {
        status: "sent",
        sentAt: new Date(),
      }),
      ...(result === "fail" && { status: "failed" }),
    },
  });
}