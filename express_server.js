const express = require("express");
const bodyParser = require("body-parser");
const { application } = require("express");
const app = express();
const PORT = 8080; // default port 8080

const generateRandomString = function() {
  const max = 123;
  const min = 48;
  const results = [];

  while (results.length < 6) {
    const randomNumber = Math.random() * (max - min) + min;
    if (randomNumber >= 48 && randomNumber <= 57) {
      results.push(String.fromCharCode(randomNumber));
    }

    if (randomNumber >= 65 && randomNumber <= 90) {
      results.push(String.fromCharCode(randomNumber));
    }

    if (randomNumber >= 97 && randomNumber <= 122) {
      results.push(String.fromCharCode(randomNumber));
    }
  }

  return results.join('');
};

app.use(bodyParser.urlencoded({extended: true}));

app.set('view engine', 'ejs');

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});

app.get('/urls/:shortURL', (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase };
  res.render('urls_show', templateVars);
});

app.post('/urls', (req, res) => {
  urlDatabase[generateRandomString()] = req.body.longURL;
  res.send('Ok');
});