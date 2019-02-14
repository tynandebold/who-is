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

app.get('/', (req, res) => {
  res.send('Up and running. Let\'s get some coworker information.');
});

app.post('/', (req, res) => {
  if (req.body.text === '') {
    res.status(200).send({
      "text": "Please enter a colleague's first or last name (or both).",
    });
    return;
  }

  if (req.body.text === 'help') {
    res.status(200).send({
      "text": "How to use /find",
      "attachments": [{
        "text": "To find useful work-related information about a coworker, search using their first name, last name, or a combination. For example, to find `Tynan DeBold`, you could search using the term `/find Tynan`, `/find debold`, or even `/find tynan DE`.\nAlso, the search isn't case sensitive, so feel free to be reckless there.\nLastly, the respone will only be visible to you, regarless of where you use the command. So you can safely use this in a channel like #general without worrying about if others will see it."
      }]
    })
  }

  const googleJWTClient = new google.auth.JWT(
    process.env.SERVICE_ACCOUNT_EMAIL,
    null,
    Buffer.from(`${process.env.SERVICE_ACCOUNT_KEY}`, 'base64').toString('ascii'),
    ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    null,
  );

  googleJWTClient.authorize((error, tokens) => {
    if (error) {
      return console.error('Couldn\'t get access token', e);
    }

    request
      .get(`https://sheets.googleapis.com/v4/spreadsheets/10ShdRhDQdGbAKFXO8RMTe9Gpi2DX-QifIRIwBfjlAWw/values/Master-PeopleList!C1:K?access_token=${tokens.access_token}`)
      .then(googRes => {
        const values = googRes.body.values;
        const regex = new RegExp(req.body.text, 'i');

        let result = [];
        for (let i = 0; i < values.length; i++) {
          let person = {};

          // If the searched name matches a person in the google sheet,
          // build an object of that person's data
          if (regex.test(values[i][0])) {
            values[0].forEach((value, j) => person[value] = values[i][j]);
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