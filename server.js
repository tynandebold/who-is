'use strict';

const express = require('express');
const request = require('superagent');
const bodyParser = require('body-parser');

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
  console.log('\n\n INCOMING SLACK PAYLOAD \n\n', req.body, '\n\n');

  if (req.body.text === '') {
    res.status(200).send({
      "text": "Please enter a colleague's first or last name (or both).",
    });
    return;
  }

  request
    .post('https://fs-3566--fhcm2.eu17.visual.force.com/apexremote')
    .set({
      'Cookie': 'BrowserId=DSB2FNsDThm324d7pmNw3g; inst=APP_1v; sid_Client=v000004rkdLY000000qrJ4; clientSrc=109.70.48.99; sid=00D0Y000000qrJ4!ARgAQPZmJjWj9wL3FoHgW3lsBbzqyc0aXo7WCA_9GIouVr8v9NY.uuT4h9.HYrZwbKMy4Pxn7CYxpQ1zrPQI2eIQdKLm7ObE; sfdc-stream=!zgOUyH0c8gRsgpsgqKcx2+WfY0HezvDg/+MKWy4ifUYC5pLwANgyR0i46U4qfEfADkZrbnnUgDzmVEc=; force-stream=!zgOUyH0c8gRsgpsgqKcx2+WfY0HezvDg/+MKWy4ifUYC5pLwANgyR0i46U4qfEfADkZrbnnUgDzmVEc=',
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
        'csrf': 'VmpFPSxNakF4T0MweE1DMHlPRlF3T0RveE9Ub3pNQzQyTlRCYSxBY3FtTGhQalJYOHIyaHJ2VVZId3NlLE56Qm1OekE1',
        'vid': '0660Y000002Qb9e',
        'ns': 'fHCM2',
        'ver': 29
      }
    })
    .then(atlasRes => {
      console.log('\n\n RESPONSE FROM ATLAS \n\n' + JSON.stringify(atlasRes.body, null, 2));

      if (atlasRes.body[0].result.length === 0) {
        res.status(200).send({
          "text": "We're sorry, we couldn't find anyone by that name. Please try someone else.",
        });
        return;
      }

      if (atlasRes.body[0].result.length === 1) {
        const { name, jobTitle, pictureUrl, id } = atlasRes.body[0].result[0];
        const location = atlasRes.body[0].result[0].contactDetails.optionAttributes[0].option.name;
        const fields = atlasRes.body[0].result[0].contactDetails.valueAttributes
          .filter(item => item.value !== undefined)
          .map(item => {
            return {
              title: item.label,
              value: item.value,
              short: true
            }
          });

        res.status(200).send({
          "attachments": [
            {
              "color": "#cccccc",
              "pretext": `You searched for *${req.body.text}*. Here's what we found:`,
              "title": name,
              "title_link": `https://fs-3566--fhcm2.eu17.visual.force.com/apex/CollaborationPortalIndex?id=a1H1v000003ImcqEAC#/teammember/${id}/org-chart`,
              "text": `${jobTitle}\n${location}`,
              fields,
              "thumb_url": pictureUrl
            }
          ]
        });
        return;
      }

      if (atlasRes.body[0].result.length > 1) {
        const multipleResults = atlasRes.body[0].result.map(person => person.name).join('\n');

        res.status(200).send({
          "attachments": [
            {
              "color": "#cccccc",
              "pretext": `You searched for *${req.body.text}*. We've found multiple results. Search for one name from the list below to see more details for that colleage.`,
              "text": multipleResults
            }
          ]
        });
        return;
      }      
    });
});

app.listen(port);
console.log(`I'm at http://localhost:${port}`);