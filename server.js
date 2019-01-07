'use strict';

require('dotenv').config();
const express = require('express');
const request = require('superagent');
const { google } = require('googleapis');
const bodyParser = require('body-parser');

const returnOne = require('./js/returnOne');
const returnNone = require('./js/returnNone');
const returnMultiple = require('./js/returnMultiple');

const app = express();
const port = process.env.PORT || 9001;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/_health', (req, res) => {
  res.json({
    ok: true,
    message: 'up and running'
  });
});

app.post('/upload', (req, res) => {
  setTimeout(() => {
    res.send({
      ok: true,
      text: "Text here."
    })
  }, 2500);
});

app.post('/', (req, res) => {
  if (req.body.text === '') {
    res.status(200).send({
      "text": "Please enter a colleague's first or last name (or both).",
    });
    return;
  }

  const googleJWTClient = new google.auth.JWT(
    process.env.SERVICE_ACCOUNT_EMAIL,
    null,
    process.env.SERVICE_ACCOUNT_KEY,
    ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    null,
  );

  googleJWTClient.authorize((error, tokens) => {
    if (error) {
      return console.error('Couldn\'t get access token', e)
    }   

    request
      .get(`https://sheets.googleapis.com/v4/spreadsheets/10ShdRhDQdGbAKFXO8RMTe9Gpi2DX-QifIRIwBfjlAWw/values/Master-PeopleList!C1:K?access_token=${tokens.access_token}`)
      .then(googRes => {
        const values = googRes.body.values;
        const regex = new RegExp(req.body.text, 'i');

        let result = [];
        for (let i = 0; i < values.length; i++) {
          let person = {};

          // if the searched name matches a person in the google sheet,
          // build and object of that person's data
          if (regex.test(values[i][0])) {
            values[0].forEach((value, j) => person[value] = values[i][j])
            result.push(person);
          }
        }

        if (result.length === 0) {
          returnNone(res);
        }

        if (result.length === 1) {
          returnOne(req, res, result);
        }

        if (result.length > 1) {
          returnMultiple(req, res, result);
        }
      })
      .catch(err => {
        console.log(err);
        
        if (err) {
          res.status(200).send({
            "text": "We're sorry, this service is unavailable right now. Please try again later.",
          });
          return;
        }
      });
  });

  
});

app.listen(port);
console.log(`I'm at http://localhost:${port}`);