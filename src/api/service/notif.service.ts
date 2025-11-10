import { prisma } from "../../lib/prisma.js";

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
