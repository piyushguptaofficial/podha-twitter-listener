console.log("✅ Script triggered by n8n...");

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

puppeteer.use(StealthPlugin());

// Read Twitter search URL from command-line argument
const searchUrl = process.argv[2];

// Path to the file where posted tweet link are stored
const processedFile = path.join(__dirname, "../processed-tweets.json");

// Load already-posted tweets
function loadProcessedTweets() {
  try {
    return JSON.parse(fs.readFileSync(processedFile, 'utf8'));
  } catch {
    return [];
  }
}

// Save updated tweet list
function saveProcessedTweets(data) {
  fs.writeFileSync(processedFile, JSON.stringify(data, null, 2));
}

// Helper: Post tweet data to Discord
async function postToDiscord(tweet) {
  console.log("Posting to Discord:", tweet.link); // Add this line
  const content = `Verified Tweet with ${tweet.likes} Likes\n${tweet.text}\n${tweet.link}`;

  try {
    await axios.post(process.env.DISCORD_WEBHOOK_URL, { content });
    console.log("Posted to Discord!");
  } catch (err) {
    console.error("Discord post failed:", err.message);
  }
}


(async () => {
  let browser;
  try {
    // Launch browser with user profile to persist login
    browser = await puppeteer.launch({
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--user-data-dir=C:/Users/piyus/AppData/Local/Google/Chrome/User Data',
        '--profile-directory=Default'
      ],
      defaultViewport: null
    });

    const page = await browser.newPage();

    // Set user agent to mimic a real browser
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
    );

    // Go to the Twitter search results page
    console.log("Navigating to search page...");
    await page.goto(searchUrl, { waitUntil: 'networkidle0', timeout: 90000 });

    // Scroll down to trigger dynamic tweet loading
    console.log("Scrolling and waiting for tweets to load...");
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Wait for tweet articles to be visible
    console.log("Waiting for tweet articles to load...");
    try {
      await page.waitForSelector('article', { timeout: 30000 });
    } catch (e) {
      console.warn("Tweets may not have loaded. Login might be required.");
    }

    // Extract raw tweet data from the DOM
    const tweets = await page.evaluate(() => {
      const articles = document.querySelectorAll('article');
      const data = [];

      articles.forEach((article) => {
        const text = article.innerText;
        const likesMatch = text.match(/(\d+)\s+Likes/);
        const likes = likesMatch ? parseInt(likesMatch[1]) : 0;
        const linkElem = article.querySelector('a[href*="/status/"]');
        const link = linkElem ? `https://twitter.com${linkElem.getAttribute('href')}` : '';
        const isBlueVerified = article.querySelector('svg[aria-label="Verified account"]') !== null;

        data.push({ text, link, likes, isBlueVerified });
      });

      return data;
    });

    console.log("Raw Tweets Captured:\n", JSON.stringify(tweets, null, 2));

    // Filter tweets based on: Verified, 3+ likes, and matching keywords
    // const filtered = tweets.filter(tweet => {
    //   const hasKeyword = keywords.some(keyword => tweet.text.toLowerCase().includes(keyword));
    //   return tweet.isBlueVerified && tweet.likes >= 3 && hasKeyword;
    // });
    const keywords = ['podha', 'rwa', 'real world assets', 'yield'];
    // const filtered = tweets.slice(0, 2); // take first 2 tweets directly

    const filtered = tweets.filter((tweet) => {
      const hasKeyword = keywords.some((keywords) => {
        tweet.text.toLowerCase().includes(keyword)
      });
      return tweet.isBlueVerified && tweet.likes >= 3 && hasKeyword;
    })


    console.log("Filtered Tweets:\n", JSON.stringify(filtered, null, 2));

    //Load list of tweets already posted
    // const postedLinks = loadProcessedTweets();

    const processedFile = path.json(__dirname, "../processed-tweets.json");
    if (!fs.existsSync(processedFile)){
      fs.writeFileSync(processedFile, JSON.stringify([]));
    }

    let postedLinks = [];
    try{
      postedLinks = JSON.parse(fs.readFileSync(processedFile, "utf8"));
    } catch (err) {
      console.warn("Could not read processed-tweets.json", err.message);
      postedLinks = [];
    }

    // Filter out already-posted tweets
    const newTweets = filtered.filter(tweet => !postedLinks.includes(tweet.link));

    // Post each filtered tweet to Discord
    for (const tweet of filtered) {
      await postToDiscord(tweet);
      postedLinks.push(tweet.link);  // save to history
    }

    //saave updated posted tweet links to JSON
    // saveProcessedTweets(postedLinks);

    try {
      fs.writeFileSync(processedFile, JSON.stringify(postedLinks, null, 2)
    );
    console.log("Updated processed-tweets.json");
    } catch (err) {
      console.error("Error writing to processed-tweets.json", err.message);
    }
    

  } catch (error) {
    console.error("Scraping failed:", error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  console.log("✅ Script finished.");

})();
