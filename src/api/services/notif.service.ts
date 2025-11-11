import { prisma } from "../../config/prisma.js";
import { publishUrgentNotification } from "../../modules/notifications/producers/urgent.producer.js";

interface TaskUpdateData {
  taskId: string;
  userIds: string[];
  priority: string;
}

const processTaskUpdate = async (data: TaskUpdateData) => {
  const notifications = [];

  for (const userId of data.userIds) {
    const notif = await prisma.notification.create({
      data: {
        taskId: data.taskId,
        userId,
        priority: data.priority,
        eventType: "task.updated",
        status: "pending",
      },
    });

     // For now only handle urgent publishing
    if (data.priority === "urgent") {
      await publishUrgentNotification({
        id: notif.id,
        taskId: notif.taskId,
        userId: notif.userId,
        priority: notif.priority,
        eventType: notif.eventType,
      });
    }

    notifications.push(notif);
  }

  return notifications;
};

const listNotifications = async () => {
  return prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });
};

export { processTaskUpdate, listNotifications };
