Using n8n, built a no-code/low-code workflow that monitors Twitter for posts related to Podha Protocol and RWA narratives, without relying on the Twitter API. The workflow authenticates via Twitter session cookie or login credentials, extract and filter tweets, and send results to a Discord channel every hour.

Till now we can scrape the data from twitter by filtering the number of likes, blue verified or not and many more filters. And also I have used n8n automation to automate the process, 

# Future Work
~ Connect it with Discord
~ Scrapped data should be stored in Discord
~ Fully working and modular n8n workflow
~ Creative use of scraping or public sources (without API)
~ Resilient: handles auth, rate limits, and avoids duplicates
~ Clean Discord message formatting
~ Bonus: admin UI, dashboard, Airtable/Notion logging
