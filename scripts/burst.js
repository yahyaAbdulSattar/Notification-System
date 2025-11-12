// scripts/burst.js
import minimist from "minimist";
import fetch from "node-fetch";

const argv = minimist(process.argv.slice(2), {
  alias: { n: "count", m: "mode", d: "delay", p: "parallel" },
  default: { count: 150, mode: "parallel", delay: 50, parallel: true },
});

console.log("[debug] argv:", process.argv);

const COUNT = Number(argv.count || 150);
const MODE = argv.mode === "sequential" ? "sequential" : "parallel";
const DELAY = Number(argv.delay || 50);
const PARALLEL = argv.parallel !== false && MODE === "parallel";
const URL = process.env.BURST_URL || "http://localhost:4000/notifications/tasks/updated";

function randomUserIds(pool, minRecipients = 1, maxRecipients = 3) {
  const k = minRecipients + Math.floor(Math.random() * (maxRecipients - minRecipients + 1));
  const out = [];
  for (let i = 0; i < k; i++) out.push(pool[Math.floor(Math.random() * pool.length)]);
  return out;
}

async function getUsersPool() {
  if (process.env.USERS_JSON) return JSON.parse(process.env.USERS_JSON);
  // fallback: try to fetch /users for ids
  try {
    const res = await fetch((process.env.API_URL || "http://localhost:4000") + "/users");
    if (!res.ok) throw new Error("couldn't fetch users");
    const users = await res.json();
    return users.map((u) => u.id);
  } catch (e) {
    // fallback small pool
    return [
      "710d3d41-ad2d-40f1-af68-372b2a645ff0",
      "507106ae-da07-43f3-aa1e-e25473e93bde",
      "64113913-6436-408b-b9a7-b801b5a6d6b4",
    ];
  }
}

async function sendOne(i, pool) {
  const recipients = randomUserIds(pool);
  const priority = Math.random() < 0.15 ? "urgent" : "normal";
  const body = {
    taskId: `burst-${Date.now()}-${i}`,
    userIds: recipients,
    priority,
    payload: { msg: `burst ${i}` },
  };

  const start = Date.now();
  try {
    const res = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const elapsed = Date.now() - start;
    return { ok: res.ok, status: res.status, elapsed };
  } catch (err) {
    const elapsed = Date.now() - start;
    return { ok: false, status: 0, elapsed, error: err.message };
  }
}

async function run() {
  const pool = await getUsersPool();
  console.log(`Burst mode=${MODE} count=${COUNT} pool=${pool.length} url=${URL}`);

  const results = [];
  const startTime = Date.now();
  if (PARALLEL) {
    const concurrency = Number(process.env.BURST_CONCURRENCY || 50);
    const batches = [];
    for (let i = 0; i < COUNT; i += concurrency) {
      const chunk = Array.from({ length: Math.min(concurrency, COUNT - i) }, (_, j) => i + j);
      // send chunk in parallel
      const chunkPromises = chunk.map((idx) => sendOne(idx, pool));
      // wait for chunk to finish before next chunk so not all at once
      const chunkRes = await Promise.all(chunkPromises);
      results.push(...chunkRes);
      if ((results.length % 20) === 0) {
        console.log(`[burst] sent ${results.length}/${COUNT}`);
      }
    }
  } else {
    for (let i = 0; i < COUNT; i++) {
      results.push(await sendOne(i, pool));
      if ((i + 1) % 20 === 0) console.log(`[burst] sent ${i + 1}/${COUNT}`);
      await new Promise((r) => setTimeout(r, DELAY));
    }
  }

  const durationMs = Date.now() - startTime;
  const successes = results.filter((r) => r.ok).length;
  const errors = results.length - successes;
  const avgLatency = Math.round(results.reduce((s, r) => s + (r.elapsed || 0), 0) / results.length);

  console.log("----- BURST SUMMARY -----");
  console.table({
    count: COUNT,
    successes,
    errors,
    avgLatencyMs: avgLatency,
    durationMs,
    rps: Math.round((COUNT / (durationMs / 1000)) || 0),
  });

  process.exit(0);
}

run().catch((e) => {
  console.error("burst failed", e);
  process.exit(1);
});
