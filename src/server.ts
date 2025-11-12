import app from "./app.js";
import dotenv from "dotenv";
import { initRabbit } from "./config/rabbitmq.js";
import { setupQueues } from "./modules/notifications/setup.js";
import { snapshot } from "./metrics/metrics.js";

dotenv.config();

const PORT = process.env.PORT || 4000;

async function startServer() {
  const { channel } = await initRabbit();
  await setupQueues(channel);
 
  setInterval(() => {
  const s = snapshot();
  console.log(`[metrics] pub=${s.notifications_published_total} urgent=${s.urgent_processed_total} normal=${s.normal_buffered_total} digest_flushed=${s.digest_flushed_total} dlq=${s.dlq_count_total} attempts=${s.attempts_total}`);
}, 10_000); // every 10s

  app.listen(PORT, () => console.log(`API running on port ${PORT}`));
}

startServer().catch((e) => {
  console.error(e);
  process.exit(1);
}); 
