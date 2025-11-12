import { prisma } from "../../config/prisma.js";
import { publishUrgentNotification } from "../../modules/notifications/producers/urgent.producer.js";
import { publishNormalNotification } from "../../modules/notifications/producers/normal.producer.js";
import * as userPrefRepo from "../../modules/users/repos/userPref.repo.js";

interface TaskUpdateData {
  taskId: string;
  userIds: string[];
  priority?: string; // optional override
}

const processTaskUpdate = async (data: TaskUpdateData) => {
  const notifications = [];

  for (const userId of data.userIds) {
    const notif = await prisma.notification.create({
      data: {
        taskId: data.taskId,
        userId,
        priority: data.priority ?? "normal",
        eventType: "task.updated",
        status: "pending",
      },
    });

    // fetch preference (cached)
    const pref = await userPrefRepo.get(userId);

    // Default fallback: treat as instant + push (safe default)
    const channel = pref?.channel ?? "push";
    const mode = pref?.mode ?? "instant";

    // envelope includes the channel so consumers know which channels to deliver
    const envelope = {
      id: notif.id,
      taskId: notif.taskId,
      userId: notif.userId,
      preference: { channel, mode },
      eventType: notif.eventType,
      priority: notif.priority,
    };

    if (mode === "instant") {
      // immediate delivery path
      await publishUrgentNotification(envelope);
    } else {
      // digest/batch path
      await publishNormalNotification(envelope);
    }

    notifications.push(notif);
  }

  return notifications;
};

export { processTaskUpdate };
