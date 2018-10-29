'use strict';

require('dotenv').config();
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
  if (req.body.text === '') {
    res.status(200).send({
      "text": "Please enter a colleague's first or last name (or both).",
    });
    return;
  }

  request
    .post('https://fs-3566--fhcm2.eu17.visual.force.com/apexremote')
    .set({
      'Cookie': 'BrowserId=DSB2FNsDThm324d7pmNw3g; inst=APP_1v; sid_Client=v000004rkdLY000000qrJ4; clientSrc=5.56.144.196; sid=00D0Y000000qrJ4!ARgAQOwUXqj1fxUltdg3NMrq82AuZ3GhpNzIj5sfMVT.Men4AE89l5.Jwxv7poZn34TC7clJ7P_XK_uIbunK2vxd.cSF5W0g; sfdc-stream=!0jUov2omRCgb3CsfOz7qOvAIicC7cgrw8ROi/INofq2hZ377UjVgJx4XMC3wLV3DRSP3WNJ31GDOBu0=; force-stream=!0jUov2omRCgb3CsfOz7qOvAIicC7cgrw8ROi/INofq2hZ377UjVgJx4XMC3wLV3DRSP3WNJ31GDOBu0=',
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
        'csrf': 'VmpFPSxNakF4T0MweE1TMHdNVlF4TWpvME5qbzFNaTQxTmpCYSxtNGtTTVJQalBGRlhEZmE4LXBBZGlOLE56Qm1OekE1',
        'vid': '0660Y000002Qb9e',
        'ns': 'fHCM2',
        'ver': 29
      }
    })
    .then(atlasRes => {
      if (atlasRes.body[0].result.length === 0) {
        res.status(200).send({
          "text": "We're sorry, we couldn't find anyone by that name. Please try someone else.",
        });
        return;
      }

      if (atlasRes.body[0].result.length === 1) {
        const { name, jobTitle, id } = atlasRes.body[0].result[0];
        const location = atlasRes.body[0].result[0].contactDetails.optionAttributes[0].option.name;
        const fields = atlasRes.body[0].result[0].contactDetails.valueAttributes
          .filter(item => item.value !== undefined)
          .filter(item => item.label !== "Company Email")
          .map(item => {
            return {
              title: item.label,
              value: item.value,
              short: true
            }
          });

        fields.unshift({
          title: 'Location',
          value: location,
          short: true
        });

        const email = atlasRes.body[0].result[0].contactDetails.valueAttributes
          .filter(item => item.label === "Company Email")
          .map(item => item.value);

        request
          .get(`https://slack.com/api/users.lookupByEmail?token=${process.env.SLACK_TOKEN}&email=thdebold@gmail.com`)
          .then(data => {
            const pictureUrl = data.body.user.profile.image_192;

            res.status(200).send({
              "attachments": [
                {
                  "color": "#cccccc",
                  "pretext": `You searched for *${req.body.text}*. Here's what we found:`,
                  "title": name,
                  "title_link": `https://fs-3566--fhcm2.eu17.visual.force.com/apex/CollaborationPortalIndex?id=a1H1v000003ImcqEAC#/teammember/${id}/org-chart`,
                  "text": `_${jobTitle}_\n${email}`,
                  fields,
                  "thumb_url": pictureUrl
                }
              ]
            });
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