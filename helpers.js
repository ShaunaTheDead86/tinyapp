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
  if (!session['user_id']) {
    return null;
  }
  
  if (!database[session['user_id'].id]) {
    return null;
  }

  return session;
};

module.exports = {
  generateRandomString,
  findUserID,
  cleanURL,
  urlsForUser,
  clearInvalidCookies
};