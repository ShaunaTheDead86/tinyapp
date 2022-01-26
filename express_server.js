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

const cleanURL = function(url) {
  const httpRegex = /^(http|https):\/\//;
  const wwwPrefix = /(www.)/;

  if (!url.match(httpRegex)) {
    if (!url.match(wwwPrefix)) {
      url = 'www.' + url;
    }
    url = 'https://' + url;
  }

  return url;
};

// MIDDLEWARE
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static('public'));

// EJS SETTINGS
app.set('view engine', 'ejs');

// DATABASES
const urlDatabase = {
  'b6UTxQ': {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  'i3BoGr': {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  },
  '9sm5xK': {
    longURL: "http://www.lighthouselabs.ca",
    userID: "aJ48lW"
  },
  'b2xVn2': {
    longURL: "http://www.google.com",
    userID: "aJ48lW"
  }
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
  const userID = req.cookies['user_id'];
  const userDatabase = {};

  if (userID !== undefined) {
    for (const item in urlDatabase) {
      if (urlDatabase[item].userID === userID.id) {
        userDatabase[item] = urlDatabase[item];
      }
    }
  }

  const templateVars = { urls: userDatabase, user: req.cookies['user_id'] };
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

app.get('/login', (req, res) => {
  const templateVars = { user: req.cookies['user_id'] };
  res.render('login_form', templateVars);
});

// GET WITH VARIABLE INPUT
app.get('/urls/:shortURL', (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: req.cookies['user_id'] };
  res.render('urls_show', templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// POST
app.post('/urls', (req, res) => {
  const shortURL = req.body.shortURL;
  const longURL = cleanURL(req.body.longURL);
  let editURL = '';
  
  if (!req.cookies.user_id) {
    return res.status(403).send('You don\'t have access to do that');
  }

  if (req.body.editURL !== undefined) {
    editURL = cleanURL(req.body.editURL);
  }

  if (urlDatabase[shortURL]) {
    const userID = req.cookies['user_id'].id;
    urlDatabase[shortURL].longURL = editURL;
    urlDatabase[shortURL].userID = userID;
  } else {
    const userID = req.cookies['user_id'].id;
    const newShortURL = generateRandomString();
    console.log(longURL, userID);
    urlDatabase[newShortURL] = {
      longURL: longURL,
      userID: userID
    };
  }
  console.log(urlDatabase);

  res.redirect('urls');
});

app.post('/login', (req, res) => {
  const userID = findUserID(req.body.email);

  if (!users[userID]) {
    return res.status(403).send('No user with that email address');
  }

  if (users[userID].password !== req.body.password) {
    return res.status(403).send('Your password doesn\'t match the password on file');
  }

  res.cookie('user_id', users[userID]);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.post('/register', (req, res) => {
  const userID = findUserID(req.body.email);

  if (req.body.email === '' || req.body.email === undefined || req.body.password === '' || req.body.password === undefined) {
    return res.status(400).send('You didn\'t fill in a required field for registering a new user.');
  }

  if (users[userID] || req.body.email === '' || req.body.password === '') {
    return res.status(400).send('That user already exists');
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

