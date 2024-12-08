const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

const url = 'https://sinhala.adaderana.lk/sinhala-hot-news.php';
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// මුල් මාර්ගය
app.get('/', (req, res) => {
  res.send('Dizer Ada Derana News API වෙත ඔබව සාදරයෙන් පිළිගනිමු! නවතම පුවත් ලබා ගැනීමට /news භාවිතා කරන්න.');
});

// පුවත් විස්තරයක් ස්ක්රේප් කිරීමේ ක්‍රියාවලිය
async function scrapeDescription(newsUrl) {
  try {
    const response = await axios.get(newsUrl);
    if (response.status === 200) {
      const $ = cheerio.load(response.data);
      let paragraphs = [];
      $('.news-content p').each((i, el) => {
        paragraphs.push($(el).text().trim());
      });
      const newsDescription = paragraphs.join('\n\n');
      return newsDescription;
    }
  } catch (error) {
    console.error('විස්තර ස්ක්රේප් කිරීමේ දෝෂයක්:', error);
  }
  return '';
}

// පුවත් රූපය ස්ක්රේප් කිරීමේ ක්‍රියාවලිය
async function scrapeImage(newsUrl) {
  try {
    const response = await axios.get(newsUrl);
    if (response.status === 200) {
      const $ = cheerio.load(response.data);
      const imageUrl = $('div.news-banner img.img-responsive').attr('src');
      return imageUrl;
    }
  } catch (error) {
    console.error('රූපය ස්ක්රේප් කිරීමේ දෝෂයක්:', error);
  }
  return '';
}

// නවතම පුවත් ලබා ගැනීමට මාර්ගය
app.get('/news', async (req, res) => {
  try {
    const response = await axios.get(url);
    if (response.status === 200) {
      const $ = cheerio.load(response.data);
      const newsArticles = [];
      
      // එක් පුවතක් නොව, පුවත් කිහිපයක් ස්ක්රේප් කරගන්නවා
      $('.story-text').each(async (i, elem) => {
        const newsHeadline = $(elem).find('h2 a').text().trim();
        const newsDate = $(elem).find('.comments span').text().trim();
        const newsTime = $(elem).find('.comments span').next().text().trim();
        const fullTime = (newsDate + ' ' + newsTime).trim();
        const newsUrl = 'https://sinhala.adaderana.lk/' + $(elem).find('h2 a').attr('href');
        const newsDescription = await scrapeDescription(newsUrl);
        const imageUrl = await scrapeImage(newsUrl);

        const newsData = {
          title: newsHeadline,
          description: newsDescription,
          image: imageUrl,
          time: fullTime,
          new_url: newsUrl,
          powered_by: "DIZER"
        };

        newsArticles.push(newsData);
      });

      // නවතම පුවත් පෙන්වීම (හෝ පුවත් නැත නම් පණිවුඩයක්)
      if (newsArticles.length === 0) {
        res.status(404).json({ error: 'නව පුවත් කිසිවක් නොමැත.' });
      } else {
        res.json(newsArticles);
      }
    } else {
      throw new Error('සංස්කරණය කරන්නට වෙබ් අඩවියෙන් දත්ත ලබා ගැනීමට අසමත් විය');
    }
  } catch (error) {
    console.error('නව පුවත් ලබා ගැනීමේ දෝෂයක්:', error);
    res.status(500).json({ error: 'අභ්‍යන්තර සේවා දෝෂයක්.' });
  }
});

// සේවාදායකය ආරම්භ කිරීම
app.listen(PORT, () => {
  console.log(`සේවාදායකය ${PORT} මත ක්‍රියාත්මක වෙයි`);
});
