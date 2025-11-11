import { initRabbit } from "../config/rabbitmq.js"
import { startUrgentConsumer } from "../modules/notifications/consumers/urgent.consumer.js";
import { setupQueues } from "../modules/notifications/setup.js";


const startWorker = async () => {
    const { channel } = await initRabbit();
    await setupQueues(channel);
    await startUrgentConsumer();
}

startWorker().catch((err) => {
  console.error("Worker error:", err);
  process.exit(1);
});