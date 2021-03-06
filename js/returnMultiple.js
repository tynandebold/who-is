module.exports = (req, slackRes, result) => {
  const multipleResults = result.map(person => person['Team Member: Full Name']).join('\n');

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