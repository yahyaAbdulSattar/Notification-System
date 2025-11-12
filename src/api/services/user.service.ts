import { prisma } from "../../config/prisma.js";

const listUsers = async () => {
  return prisma.user.findMany({ include: { preferences: true } });
};

const seedUsers = async () => {
  const demo = [
    { name: "Ali Khan", email: "ali.khan@example.com", channel: "push", mode: "instant" },
    { name: "Fatima Zahra", email: "fatima.zahra@example.com", channel: "email", mode: "digest" },
    { name: "Omar Siddiqui", email: "omar.siddiqui@example.com", channel: "both", mode: "instant" },
    { name: "Layla Hasan", email: "layla.hasan@example.com", channel: "email", mode: "digest" },
    { name: "Yusuf Rahman", email: "yusuf.rahman@example.com", channel: "push", mode: "instant" },
    { name: "Aisha Ahmed", email: "aisha.ahmed@example.com", channel: "both", mode: "digest" },
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
      update: { channel: u.channel, mode: u.mode },
      create: { userId: user.id, channel: u.channel, mode: u.mode },
    });

    created.push(user);
  }

  return created;
};

export { listUsers, seedUsers };
