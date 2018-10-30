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

app.post('/', (req, res) => {
  if (req.body.text === '') {
    res.status(200).send({
      "text": "Please enter a colleague's first or last name (or both).",
    });
    return;
  }

  request
    .post('https://fs-3566--fhcm2.eu17.visual.force.com/apexremote')
    .set({
      'Cookie': 'BrowserId=DSB2FNsDThm324d7pmNw3g; inst=APP_1v; sid_Client=v000004rkdLY000000qrJ4; sid=00D0Y000000qrJ4!ARgAQEIVU43UTjtAVOxxPd33XJNiJQYtUYTz50Nc0jzNN89._KnDZMRyLJ4zTYUnpwDi7Oi8ymXCwqBBVLlP9l4v53SoYaeN; clientSrc=109.70.48.99; sfdc-stream=!IC544pckI8FdcDwfOz7qOvAIicC7cr7XBKfjssp4CiQXP4FClyTN1h1ceZEp0a+5A4qtDt5HDFXGQqU=; force-stream=!IC544pckI8FdcDwfOz7qOvAIicC7cr7XBKfjssp4CiQXP4FClyTN1h1ceZEp0a+5A4qtDt5HDFXGQqU=',
      'Host': 'fs-3566--fhcm2.eu17.visual.force.com',
      'Origin': 'https://fs-3566--fhcm2.eu17.visual.force.com',
      'Referer': 'https://fs-3566--fhcm2.eu17.visual.force.com/apex/CollaborationPortalIndex?id=a1H1v000003ImcqEAC'
    })
    .send({
      'action': 'fHCM2.CollaborationPortalRAController',
      'method': 'getContacts',
      'data': [req.body.text, ''],
      'type': 'rpc',
      'tid': 10,
      'ctx': {
        'csrf': 'VmpFPSxNakF4T0MweE1TMHdNbFF4TXpveU5qbzFNQzQwTWpWYSx1OFdnVzdPNE5sY3NrLTJkdkh5eDZsLE56Qm1OekE1',
        'vid': '0660Y000002Qb9e',
        'ns': 'fHCM2',
        'ver': 29
      }
    })
    .then(atlasRes => {
      if (atlasRes.body[0].result.length === 0) {
        returnNone(res);
      }

      if (atlasRes.body[0].result.length === 1) {
        returnOne(req, res, atlasRes);
      }

      if (atlasRes.body[0].result.length > 1) {
        returnMultiple(req, res, atlasRes);
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