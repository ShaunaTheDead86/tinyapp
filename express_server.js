const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require('bcryptjs');
const { application } = require("express");
const { generateRandomString, getUserByEmail, cleanURL, urlsForUser, checkLoggedIn } = require('./helpers');
const app = express();
const PORT = 8080; // default port 8080

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
    userID: "aJ48lW",
    created: Date.now(),
    visits: 0,
    uniqueVisits: 0
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
  },
  'test': {
    longURL: 'http://www.google.com',
    userID: 'test'
  }
};

const users = {
  userID: 'test'
};

const visitors = {

};

// LISTENER
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// GET
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/", (req, res) => {
  if (!checkLoggedIn(req.session)) {
    res.redirect('/login');
  }
});

app.get("/urls", (req, res) => {
  let userID;

  if (req.session['user_id']) {
    userID = req.session['user_id'].id;
  }

  const userDatabase = urlsForUser(userID, urlDatabase);
  console.log(userDatabase);
  const templateVars = { urls: userDatabase, user: req.session['user_id'] };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  if (!checkLoggedIn(req.session)) {
    res.redirect('/login');
  }

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
  if (!urlDatabase[req.params.shortURL]) {
    return res.status(404).send('That short URL does not exist');
  }

  let userID;

  if (req.session['user_id']) {
    userID = req.session['user_id'].id;
  }
  const userDatabase = urlsForUser(userID, urlDatabase);

  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: req.session['user_id'], userURLs: userDatabase };
  res.render('urls_show', templateVars);
});

app.get("/u/:shortURL", (req, res) => {

  if (!urlDatabase[req.params.shortURL]) {
    return res.status(404).send('That short URL does not exist');
  }

  const longURL = urlDatabase[req.params.shortURL].longURL;

  // increment visits every time
  urlDatabase[req.params.shortURL].visits++;

  // check if visit has a unique ip, increment unique visits if ip is not in the vistors list
  if (!visitors[req.ip]) {
    visitors[req.ip] = req.ip;
    urlDatabase[req.params.shortURL].uniqueVisits++;
  }

  res.redirect(longURL);
});

// POST
app.post('/urls', (req, res) => {
  if (!req.session['user_id']) {
    return res.status(403).send('You don\'t have access to do that');
  }

  const shortURL = req.body.shortURL;
  const longURL = cleanURL(req.body.longURL);
  let editURL = '';

  if (req.body.editURL !== undefined) {
    editURL = cleanURL(req.body.editURL);
  }

  if (urlDatabase[shortURL]) {
    const userID = req.session['user_id'].id;
    urlDatabase[shortURL] = {
      longURL: editURL,
      userID: userID,
      created: new Date(Date.now()).toLocaleDateString(),
      visits: 0,
      uniqueVisits: 0
    };
  } else {
    const userID = req.session['user_id'].id;
    const newShortURL = generateRandomString();
    urlDatabase[newShortURL] = {
      longURL: longURL,
      userID: userID,
      created: new Date(Date.now()).toLocaleDateString(),
      visits: 0,
      uniqueVisits: 0
    };
  }

  res.redirect('urls');
});

app.post('/login', (req, res) => {
  const userID = getUserByEmail(req.body.email, users);

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
  const userID = getUserByEmail(req.body.email, users);

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

