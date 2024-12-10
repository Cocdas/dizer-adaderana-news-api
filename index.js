const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
const PORT = process.env.PORT || 3000;

// Hiru News URL
const BASE_URL = "https://www.hirunews.lk/local-news.php?pageID=1";

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

// Root Route
app.get("/", (req, res) => {
  res.send("Welcome to the Hiru News API! Use /news to fetch the latest local news.");
});

// Scraping Logic
async function fetchNews() {
  try {
    const response = await axios.get(BASE_URL);
    if (response.status === 200) {
      const $ = cheerio.load(response.data);
      let newsArray = [];

      $(".news-holder").each((i, element) => {
        const title = $(element).find("h2").text().trim();
        const url = "https://www.hirunews.lk" + $(element).find("a").attr("href");
        const image = $(element).find("img").attr("src");
        const date = $(element).find(".date").text().trim();

        newsArray.push({
          title,
          url,
          image,
          date,
          powered_by: "DIZER",
        });
      });

      return newsArray;
    }
  } catch (error) {
    console.error("Error fetching Hiru News:", error.message);
    return [];
  }
}

// News Route
app.get("/news", async (req, res) => {
  try {
    const news = await fetchNews();
    if (news.length > 0) {
      res.json(news);
    } else {
      res.status(404).json({ error: "No news articles found." });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start the Server
app.listen(PORT, () => {
  console.log(`Hiru News API is running on port ${PORT}`);
});
