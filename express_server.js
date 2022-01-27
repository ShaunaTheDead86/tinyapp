const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require('bcryptjs');
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

const findUserID = function(email, database) {
  for (const userID in database) {
    if (database[userID].email === email) {
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

const urlsForUser = function(id) {
  const results = {};
  
  if (id !== undefined) {
    for (const item in urlDatabase) {
      if (urlDatabase[item].userID === id) {
        results[item] = urlDatabase[item];
      }
    }
  }
  return results;
};

const clearInvalidCookies = function(session, database) {
  if (!session) {
    return null;
  }
  
  if (!database[session.id]) {
    return null;
  }
  return session;
};

// MIDDLEWARE
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));
app.use(cookieSession({
  name: 'user_id',
  keys: ['key1'],
  signed: false
}));

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
  let userID;

  if (req.session['user_id']) {
    userID = req.session['user_id'].id;
  }

  const userDatabase = urlsForUser(userID);
  const templateVars = { urls: userDatabase, user: req.session['user_id'] };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  const templateVars = { user: req.session['user_id'] };
  res.render('urls_new', templateVars);
});

app.get('/register', (req, res) => {
  const templateVars = { user: req.session['user_id'] };
  res.render('user_form', templateVars);
});

app.get('/login', (req, res) => {
  const templateVars = { user: req.session['user_id'] };
  res.render('login_form', templateVars);
});

// GET WITH VARIABLE INPUT
app.get('/urls/:shortURL', (req, res) => {
  let userID;
  if (req.session['user_id']) {
    userID = req.session['user_id'].id;
  }
  const userDatabase = urlsForUser(userID);

  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: req.session['user_id'], userURLs: userDatabase };
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
  
  if (!req.session['user_id']) {
    return res.status(403).send('You don\'t have access to do that');
  }

  if (req.body.editURL !== undefined) {
    editURL = cleanURL(req.body.editURL);
  }

  if (urlDatabase[shortURL]) {
    const userID = req.session['user_id'].id;
    urlDatabase[shortURL].longURL = editURL;
    urlDatabase[shortURL].userID = userID;
  } else {
    const userID = req.session['user_id'].id;
    const newShortURL = generateRandomString();
    urlDatabase[newShortURL] = {
      longURL: longURL,
      userID: userID
    };
  }

  res.redirect('urls');
});

app.post('/login', (req, res) => {
  const userID = findUserID(req.body.email, users);

  if (!users[userID]) {
    return res.status(403).send('No user with that email address');
  }

  if (!bcrypt.compareSync(req.body.password, users[userID].password)) {
    return res.status(403).send('Your password doesn\'t match the password on file');
  }

  req.session['user_id'] = users[userID];
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.post('/register', (req, res) => {
  const userID = findUserID(req.body.email, users);

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
    password: bcrypt.hashSync(req.body.password, 10)
  };

  users[newUserID] = newUserInfo;

  req.session['user_id'] = users[newUserID];
  res.redirect('/urls');
});

// POST WITH VARIABLE INPUT
app.post('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  
  if (req.session['user_id']) {
    const userID = req.session['user_id'].id;
    if (urlDatabase[shortURL].userID !== userID) {
      return res.status(403).send('You don\'t have access to that');
    }
  } else {
    return res.status(403).send('You are not logged in, please login and try again');
  }

  res.redirect(`/urls/${req.params.shortURL}`);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;

  if (req.session['user_id']) {
    const userID = req.session['user_id'].id;
    if (urlDatabase[shortURL].userID !== userID) {
      return res.status(403).send('You don\'t have access to that');
    }
  } else {
    return res.status(403).send('You are not logged in, please login and try again');
  }

  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

