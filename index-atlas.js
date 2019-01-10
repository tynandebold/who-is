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
    .post('https://fs-3566--fhcm2.eu17.visual.force.com/apexremote')
    .set({
      'Cookie': 'BrowserId=ukYxcWHfQvG5Pqsaa5vx0w; inst=APP_1v; sid_Client=v000004rkdLY000000qrJ4; clientSrc=5.56.144.196; sid=00D0Y000000qrJ4!ARgAQCQ8s433WF9EjpOP8iQ1MKaYRIg8TAcD6fBpvTqGZSf48_UogoALaheF.wdVhlOJc2Rv7tklBslQU9sWViQ_uO1nk8F3; sfdc-stream=!1WaKGTZKRz+YPRUgqKcx2+WfY0HeziCJt7PX9GBff+dgiWij8vHIv9H14MOo5/uXTTSOWvImq018J2M=',
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
        'csrf': 'VmpFPSxNakF4T1Mwd01TMHdOMVF3T1RveU5Eb3hNQzR4T1RCYSxERGtrM0lEdl9xdU5wREZNaDVrU1BJLE56Qm1OekE1',
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