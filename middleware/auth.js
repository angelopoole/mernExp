const jwt = require('jsonwebtoken');
const config = require('config');

// middleware function is a function that has access to the request and response objects, + the next which is a callback that runs when done to move to next middleware function

module.exports = function (req, res, next) {
	// get token from header
	const token = req.header('x-auth-token');

	// check if no token
	if (!token) {
		return res.status(401).json({ msg: 'No Token, authorization denied' });
	}
	// verify token
	try {
		const decoded = jwt.verify(token, config.get('jwtSecret'));

		req.user = decoded.user;
		next();
	} catch (err) {
		res.status(401).json({ msg: 'Token is not valid' });
	}
};
