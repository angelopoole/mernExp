const express = require('express');
const gravitar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');
const User = require('../../models/User');

const router = express.Router();
// make sure we bring out our model User.

// @route   Post api/users
// @desc    register user.
// @access  Public

router.post(
	'/',
	[
		check('name', 'Name is required!').not().isEmpty(),
		check('email', 'Please include a valid email!').isEmail(),
		check(
			'password',
			'Please enter a password with 6 or more characters'
		).isLength({ min: 6 }),
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const { name, email, password } = req.body;

		try {
			let user = await User.findOne({ email });

			// see if the user exists: send err if true
			if (user) {
				return res
					.status(400)
					.json({ errors: [{ msg: 'User already exists' }] });
			}

			// Get users gravitar based on email and set as avatar
			const avatar = gravitar.url(email, {
				s: '200',
				r: 'pg',
				d: 'mm',
			});

			// create user instance
			user = new User({
				name,
				email,
				password,
				avatar,
			});
			// encrypt password: using bcryptjs

			const salt = await bcrypt.genSalt(10);
			user.password = await bcrypt.hash(password, salt);

			await user.save();

			// return jwt
			// you could add things to the payload such as isAdmin:boolean
			const payload = {
				user: {
					id: user.id,
				},
			};

			jwt.sign(
				payload,
				config.get('jwtSecret'),
				{ expiresIn: 3600 },
				(err, token) => {
					if (err) throw err;
					res.json({ token });
				}
			);
		} catch (err) {
			console.error(err.message);
			res.status(500).send('Sever error');
		}

		// console.log(req.body);
	}
);

module.exports = router;
