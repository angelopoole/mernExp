const jwt = require('jsonwebtoken');
const config = require('config');

// middleware function is a function that has access to the request and response objects, + the next which is a callback that runs when done to move to next middleware function

module.exports = function (req, res, next) {
  //get token from header
  const token = req.headder('x-auth-token');
};
