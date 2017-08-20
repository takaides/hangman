const express = require('express');
const bodyParser = require('body-parser');
const handlebars = require('express-handlebars');
const session = require('express-session');
const expressValidator = require('express-validator');
const fs = require('fs');

//get words
const words = fs.readFileSync("/usr/share/dict/words", "utf-8").toLowerCase().split("\n");

const app = express();

app.use(express.static('public'));

app.engine('handlebars', handlebars());
app.set('views', './views');
app.set('view engine', 'handlebars');

app.use(expressValidator());

app.use(
  session({
    secret: 'this is a secret',
    resave: false,
    saveUninitialized: true
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(expressValidator());

let newWord = () => {
  console.log('Generating new word!');
  let x = Math.floor(Math.random() * words.length);
  let word = words[x].toUpperCase();
  console.log('word:', word);
  if (word.length > 12) {
    console.log('Word too long!');
    word = newWord();
  }
  return word;
}

let newHiddenWord = (word) => {
  let hw = word.split('');
  hw = hw.fill('_');
  // console.log('Hidden word:', hw);
  return hw;
}

let hiddenWordReplace = (word, letter, hw) => {
  console.log(hw);
  console.log("word length: ", word.length);
  console.log('hw: ', hw.length);
  for (var i = 0; i < word.length; i++) {
    console.log('splice loop: ', i);
    if (word[i] === letter) {
      console.log(`splice(${i}, 1, ${letter})`);
      hw.splice(i, 1, letter);
      console.log(hw);
    }
  }
  return hw;
}

// on new session, generate new word and default values
app.use((req, res, next) => {
  if (!req.session.word) {
    console.log('New session!');
    req.session.word = newWord();
    req.session.guesses = 8;
    req.session.hiddenWord = newHiddenWord(req.session.word);
    req.session.badGuesses = [];
  }
  next();
});

app.get('/', (req, res) => {
  if (req.session.guesses === 0 || !req.session.hiddenWord.includes('_')) {
    return res.redirect('/endgame');
  }
  // var g = req.session.guesses;
  // var hW = req.session.hiddenWord;
  console.log('hiddenWord: ', req.session.hiddenWord);
  // var bG = req.session.badGuesses;
  console.log('badGuess: ', req.session.badGuesses);
  console.log('errors: ', req.body.errors);
  res.render('main', {
    guesses: req.session.guesses,
    hiddenWord: req.session.hiddenWord,
    badGuesses: req.session.badGuesses,
    errors: req.body.errors
  });
});

app.post('/', (req, res) => {
  let guess = req.body.guess.toUpperCase();
  req.body.errors = [];
  console.log('Guess: ', guess);

  req.checkBody('guess', 'Must be a letter in the Alphabet').isAlpha();
  req.checkBody('guess', 'Must enter one letter').len(1, 1);

  req.getValidationResult().then((issue) => {
      if (issue.isEmpty()) {
        console.log("No issues!");
      } else {
        req.body.errors.push(issue);
        return res.redirect('/');
      }
      if (req.session.badGuesses.includes(guess) || req.session.hiddenWord.includes(guess)) {
        req.body.errors.push(`You already guessed ${guess}`);
        console.log(req.body.errors);
      } else {
        if (req.session.word.includes(guess)) {
          console.log('Good Guess');
          req.session.hiddenWord = hiddenWordReplace(req.session.word, guess, req.session.hiddenWord);
        } else {
          req.session.badGuesses.push(guess);
          req.session.guesses--
        }
      }

    })
    .then(() => {
      res.redirect('/');
    })

})

app.get('/endgame', (req, res) => {
  word = req.session.word;
  delete req.session.word;
  if (req.session.hiddenWord.includes('_') && req.session.guesses === 0) {
    console.log('Game Lost');
    var won = false;
  } else {
    console.log('Game Won!');
    var won = true;
  }
  res.render('endgame', {
    word: word,
    guessesLeft: req.session.guesses,
    winningCondition: won
  })
});









app.listen(3000, function() {
  console.log('Application started.  Listening on port 3000');
});
