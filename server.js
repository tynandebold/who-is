'use strict';

require('dotenv').config();
const express = require('express');
const request = require('superagent');
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

  request
    .get(`https://sheets.googleapis.com/v4/spreadsheets/1OPDkzlWmSTow8-nI6eL7BHximMdDn6TSXPAb7aKpXvg/values/Master-PeopleList!A1:G?key=${process.env.GOOGLE_API_KEY}`)
    .then(googRes => {
      const values = googRes.body.values;      

      let result = [];
      const regex = new RegExp(req.body.text, 'i');
      for (let i = 0; i < values.length; i++) {
        let person = {};
        if (regex.test(values[i][0])) {
          values[0].forEach((value, j) => person[value] = values[i][j])
          result.push(person);
        }
      }
      
      // if (googRes.body[0].result.length === 0) {
      //   returnNone(res);
      // }

      // if (googRes.body[0].result.length === 1) {
      //   returnOne(req, res, googRes);
      // }

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

app.listen(port);
console.log(`I'm at http://localhost:${port}`);