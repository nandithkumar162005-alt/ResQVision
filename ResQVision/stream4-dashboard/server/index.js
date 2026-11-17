import { createApp } from './app.js';
import { CONFIG } from './config.js';

const app = createApp();

const HOST = process.env.HOST || '0.0.0.0';

app.listen(CONFIG.port, HOST, () => {
  console.log(`ResQVision Layer 3 Backend listening at http://${HOST}:${CONFIG.port}`);
});
