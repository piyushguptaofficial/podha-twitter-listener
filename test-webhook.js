require('dotenv').config();
console.log("Loaded webhook URL:", process.env.DISCORD_WEBHOOK_URL); 

const axios = require('axios');


(async () => {
  try {
    await axios.post(process.env.DISCORD_WEBHOOK_URL, {
      content: "✅ Webhook test message from Puppeteer bot!"
    });
    console.log("Test message sent to Discord!");
  } catch (err) {
    console.error("❌ Webhook failed:", err.message);
  }
})();
