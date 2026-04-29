const { SquareClient, SquareEnvironment } = require("square");

const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: SquareEnvironment.Production,
});

module.exports = squareClient;