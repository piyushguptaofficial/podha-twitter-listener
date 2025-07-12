require("dotenv").config();
const axios = require("axios");

(async () => {
  try {
    await axios.post(process.env.DISCORD_WEBHOOK_URL, {
      content: "Test message from script"
    });
    console.log("Webhook test successful");
  } catch (err) {
    console.error("Webhook test failed:", err.message);
  }
})();
