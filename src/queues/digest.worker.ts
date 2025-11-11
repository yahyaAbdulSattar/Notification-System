import { initRabbit } from "../config/rabbitmq.js";
import { setupQueues } from "../modules/notifications/setup.js";
import { flushAllBatches } from "../modules/notifications/services/digest.service.js";

const FLUSH_INTERVAL = 10_000; // 10s for demo; can be 60s+

async function startDigestWorker() {
  const { channel } = await initRabbit();
  await setupQueues(channel);

  console.log("[digest.worker] started");

//   ADD CRON JOB LATER
  setInterval(async () => {
    await flushAllBatches();
  }, FLUSH_INTERVAL);
}

startDigestWorker().catch((err) => {
  console.error("digest.worker error:", err);
  process.exit(1);
});
