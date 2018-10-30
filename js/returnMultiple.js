module.exports = (req, slackRes, atlasRes) => {
  const multipleResults = atlasRes.body[0].result.map(person => person.name).join('\n');

  slackRes.status(200).send({
    "attachments": [
      {
        "color": "#cccccc",
        "pretext": `You searched for *${req.body.text}*. We've found multiple results. Search for one name from the list below to see more details for that colleage.`,
        "text": multipleResults
      }
    ]
  });
};