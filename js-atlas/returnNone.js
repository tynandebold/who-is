module.exports = function(res) {
  res.status(200).send({
    "text": "We're sorry, we couldn't find anyone by that name. Please try someone else.",
  });
}