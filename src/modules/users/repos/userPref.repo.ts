import { prisma } from "../../../config/prisma.js";
import { redis } from "../../../config/redis.js";

const PREF_KEY = (userId: string) => `pref:${userId}`;
const CACHE_TTL = 300; // seconds

export type UserPref = {
  userId: string;
  channel: "push" | "email" | "both";
  mode: "instant" | "digest";
};

export async function get(userId: string): Promise<UserPref | null> {
  const key = PREF_KEY(userId);
  // try cache
  const cached = await redis.get(key);
  if (cached) {
    try {
      return JSON.parse(cached) as UserPref;
    } catch (e) {
      await redis.del(key);
    }
  }

  // fallback to DB
  const row = await prisma.userPreference.findUnique({ where: { userId } });
  if (!row) return null;
  const pref: UserPref = {
    userId: row.userId,
    channel: row.channel as UserPref["channel"],
    mode: row.mode as UserPref["mode"],
  };
  await redis.set(key, JSON.stringify(pref), "EX", CACHE_TTL);
  return pref;
}

export async function set(userId: string, channel: UserPref["channel"], mode: UserPref["mode"]) {
  // upsert in DB
  await prisma.userPreference.upsert({
    where: { userId },
    update: { channel, mode },
    create: { userId, channel, mode },
  });
  // invalidate cache (write-through by setting new value)
  const key = PREF_KEY(userId);
  const pref = { userId, channel, mode };
  await redis.set(key, JSON.stringify(pref), "EX", CACHE_TTL);
  return pref;
}

export async function invalidate(userId: string) {
  await redis.del(PREF_KEY(userId));
}
