const request = require('superagent');

module.exports = (req, slackRes, atlasRes) => {
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
    .get(`https://slack.com/api/users.lookupByEmail?token=${process.env.SLACK_TOKEN}&email=dov@dovfriedman.com`)
    .then(data => {
      const pictureUrl = data.body.user.profile.image_192;

      slackRes.status(200).send({
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
}