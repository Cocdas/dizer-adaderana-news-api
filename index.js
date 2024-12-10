const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

const url = 'https://www.hirunews.lk/local-news.php?pageID=1';
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the dizer- Hiru News API! Use /news to fetch the latest news.');
});

// Function to scrape the description
async function scrapeDescription(newsUrl) {
  try {
    const response = await axios.get(newsUrl);
    if (response.status === 200) {
      const $ = cheerio.load(response.data);
      const description = $('.news-content').text().trim();
      return description || 'No description available';
    }
  } catch (error) {
    console.error('Error scraping description:', error);
    return 'Error fetching description';
  }
}

// Route for news
app.get('/news', async (req, res) => {
  try {
    const response = await axios.get(url);
    if (response.status === 200) {
      const $ = cheerio.load(response.data);

      const newsArticle = $('.lts-cntp').first(); // First news article
      const newsHeadline = newsArticle.find('h3 a').text().trim();
      const newsUrl = 'https://www.hirunews.lk' + newsArticle.find('h3 a').attr('href');
      const imageUrl = newsArticle.find('.latest-pic img').attr('src');
      const newsDescription = await scrapeDescription(newsUrl);

      const newsData = {
        title: newsHeadline || 'No Title Found',
        description: newsDescription,
        image: imageUrl || 'No Image Found',
        new_url: newsUrl || 'No URL Found',
        powered_by: 'DIZER',
      };

      res.json([newsData]);
    } else {
      throw new Error('Failed to fetch data from the website');
    }
  } catch (error) {
    console.error('Error fetching news:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
