import { prisma } from "../../lib/prisma.js";

const listUsers = async () => {
  return prisma.user.findMany({ include: { preferences: true } });
};

const seedUsers = async () => {
  const demo = [
    { name: "Ali", email: "ali@example.com", channel: "push" },
    { name: "Fatima", email: "fatima@example.com", channel: "email" },
    { name: "Omar", email: "omar@example.com", channel: "both" },
  ];

  const created = [];

  for (const u of demo) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { name: u.name, email: u.email },
    });

    await prisma.userPreference.upsert({
      where: { userId: user.id },
      update: { channel: u.channel },
      create: { userId: user.id, channel: u.channel },
    });

    created.push(user);
  }

  return created;
};

export { listUsers, seedUsers };
