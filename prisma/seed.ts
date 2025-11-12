import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const users = [
    { id: "710d3d41-ad2d-40f1-af68-372b2a645ff0", name: "Alice", email: "alice@example.com" },
    { id: "507106ae-da07-43f3-aa1e-e25473e93bde", name: "Bob", email: "bob@example.com" },
    { id: "64113913-6436-408b-b9a7-b801b5a6d6b4", name: "Charlie", email: "charlie@example.com" },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: user,
    });
  }

  console.log("Seeded 3 demo users");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
