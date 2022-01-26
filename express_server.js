const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { application } = require("express");
const app = express();
const PORT = 8080; // default port 8080

// FUNCTIONS
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

const findUserID = function(email) {
  for (const userID in users) {
    if (users[userID].email === email) {
      return userID;
    }
  }
  return null;
};

// MIDDLEWARE
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static('public'));

// EJS SETTINGS
app.set('view engine', 'ejs');

// DATABASES
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
};

// LISTENER
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// GET
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  console.log(users);
  const templateVars = { urls: urlDatabase, user: req.cookies['user_id'] };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  const templateVars = { user: req.cookies['user_id'] };
  res.render('urls_new', templateVars);
});

app.get('/register', (req, res) => {
  const templateVars = { user: req.cookies['user_id'] };
  res.render('user_form', templateVars);
});

// GET WITH VARIABLE INPUT
app.get('/urls/:shortURL', (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies['user_id'] };
  res.render('urls_show', templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// POST
app.post('/urls', (req, res) => {
  const shortURL = req.body.shortURL;
  const longURL = req.body.longURL;
  const editURL = req.body.editURL;

  if (urlDatabase[shortURL]) {
    urlDatabase[shortURL] = editURL;
  } else {
    const newShortURL = generateRandomString();
    urlDatabase[newShortURL] = longURL;
  }

  res.redirect('urls');
});

app.post('/login', (req, res) => {
  const userID = findUserID(req.body.email);
  console.log(userID);
  console.log(users[userID]);

  if (users[userID]) {
    res.cookie('user_id', users[userID]);
  }
  
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.post('/register', (req, res) => {
  const userID = findUserID(req.body.email);

  if (users[userID] || req.body.email === '' || req.body.password === '') {
    return res.redirect(400, '/register');
  }

  let newUserID = generateRandomString();

  // if the randomly generated string already exists in the database, keep generating new strings until we get one that doesn't
  while (users[newUserID]) {
    newUserID = generateRandomString();
  }

  const newUserInfo = {
    id: newUserID,
    email: req.body.email,
    password: req.body.password
  };

  users[newUserID] = newUserInfo;

  res.cookie('user_id',users[newUserID]);
  res.redirect('/urls');
});

// POST WITH VARIABLE INPUT
app.post('/urls/:shortURL', (req, res) => {
  res.redirect(`/urls/${req.params.shortURL}`);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

