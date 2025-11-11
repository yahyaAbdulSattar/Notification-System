import app from "./app.js";
import dotenv from "dotenv";
import { initRabbit } from "./config/rabbitmq.js";
import { setupQueues } from "./modules/notifications/setup.js";

dotenv.config();

const PORT = process.env.PORT || 4000;

async function startServer() {
  const { channel } = await initRabbit();
  await setupQueues(channel);

  app.listen(PORT, () => console.log(`API running on port ${PORT}`));
}

startServer().catch((e) => {
  console.error(e);
  process.exit(1);
}); 
