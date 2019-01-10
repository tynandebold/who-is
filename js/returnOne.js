const request = require('superagent');

module.exports = (req, slackRes, result) => {
  const name = result[0]['Team Member: Full Name'];
  const jobTitle = result[0].Role;
  const email = result[0]['Company Email'];
  const emailFormatted = `${result[0]['Company Email']}\n–––––––––––––––––––––––––––––––––––––––`;

  let fields = [];
  for (const key of Object.keys(result[0])) {
    fields.push({
      title: key === 'People Manager' ? 'Manager' : key,
      value: result[0][key],
      short: true
    });
  }

  fields = fields
    .filter(field => field.title !== 'Team Member: Full Name')
    .filter(field => field.title !== 'Company Email')
    .filter(field => field.title !== 'Role');

  request
    .get(`https://slack.com/api/users.lookupByEmail?token=${process.env.SLACK_TOKEN}&email=${email}`)
    .then(data => {
      const pictureUrl = data.body.user.profile.image_192;

      slackRes.status(200).send({
        "attachments": [
          {
            "color": "#cccccc",
            "pretext": `You searched for *${req.body.text}*. Here's what we found:`,
            "title": name,
            "text": `_${jobTitle}_\n${emailFormatted}`,
            fields,
            "thumb_url": pictureUrl
          }
        ]
      });
    });
}