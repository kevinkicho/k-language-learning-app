const fetch = require('node-fetch');
const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;

fetch(url)
  .then(res => res.json())
  .then(data => console.log(JSON.stringify(data, null, 2)))
  .catch(err => console.error(err)); 