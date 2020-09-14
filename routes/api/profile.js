const express = require('express');
const axios = require('axios');
const router = express.Router();
const config = require('config');
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
// bring in normalize to give us a proper url, regardless of what user entered, to be added to website social profile field @route    POST api/profile

const normalize = require('normalize-url');

const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route   Get api/profile/me
// @desc    Get current users profile
// @access  Private

router.get('/me', auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({
			user: req.user.id,
		}).populate('user', ['name', 'avatar']);

		if (!profile) {
			return res.status(400).json({ msg: 'There is no profile for this user' });
		}

		res.json(profile);
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});

// @route   Post api/profile
// @desc    create or update a user profile
// @access  Private

router.post(
	'/',
	[
		auth,
		[
			check('status', 'Status is required').not().isEmpty(),
			check('skills', 'Skills is required').not().isEmpty(),
		],
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const {
			company,
			website,
			location,
			bio,
			status,
			githubusername,
			skills,
			youtube,
			facebook,
			twitter,
			instagram,
			linkedin,
		} = req.body;

		// Build profile object
		const profileFields = {};
		profileFields.user = req.user.id;

		if (company) profileFields.company = company;
		if (website) profileFields.website = website;
		if (location) profileFields.location = location;
		if (bio) profileFields.bio = bio;
		if (status) profileFields.status = status;
		if (githubusername) profileFields.githubusername = githubusername;
		if (skills) {
			profileFields.skills = skills.split(',').map(skill => skill.trim());
		}

		// Build social object
		profileFields.social = {};
		if (youtube) profileFields.social.youtube = youtube;
		if (twitter) profileFields.social.twitter = twitter;
		if (facebook) profileFields.social.facebook = facebook;
		if (linkedin) profileFields.social.linkedin = linkedin;
		if (instagram) profileFields.social.instagram = instagram;

		try {
			let profile = await Profile.findOne({ user: req.user.id });

			if (profile) {
				//update
				profile = await Profile.findOneAndUpdate(
					{ user: req.user.id },
					{ $set: profileFields },
					{ new: true }
				);
				return res.json(profile);
			}

			//create
			// profile = new Profile(profileFields);
			// await profile.save();
			// res.json(profile);

			profile = await Profile.create(profileFields);
			res.json(profile);
		} catch (err) {
			console.error(err.message);
			res.status(500).send('Server Error');
		}
	}
);

// @route   Get api/profiles
// @desc    Get all user profiles
// @access  Public
router.get('/', async (req, res) => {
	try {
		//populate will take in a model to populate from and the attributes of the model that you want to add to the resource that you're pulling from.
		const profiles = await Profile.find().populate('user', ['name', 'avatar']);
		res.send(profiles);
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});

// @route   Get api/profile/user/:user_id
// @desc    Get profile by user id
// @access  Public
router.get('/user/:user_id', async (req, res) => {
	try {
		const profile = await Profile.findOne({
			user: req.params.user_id,
		}).populate('user', ['name', 'avatar']);

		if (!profile)
			return res.status(400).json({ msg: 'there is no profile for this user' });

		res.send(profile);
	} catch (err) {
		console.error(err.message);
		if (err.kind == 'ObjectId') {
			return res.status(400).json({ msg: 'There is no profile for this user' });
		}
		res.status(500).send('Server Error');
	}
});

// @route   Delete api/profile
// @desc    delete profile, user and posts
// @access  Private
router.delete('/', auth, async (req, res) => {
	try {
		//@todo - remove users posts
		// remove profile
		await Profile.findOneAndDelete({ user: req.user.id });
		// remove user
		await User.findOneAndDelete({ _id: req.user.id });

		res.json({ msg: 'user Deleted' });
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});

// @route   Put api/profile/experience
// @desc    Add profile experience
// @access  Private

router.put(
	'/experience',
	[
		auth,
		[
			check('title', 'Title is reqired').not().isEmpty(),
			check('company', 'Company is reqired').not().isEmpty(),
			check('from', 'From date is reqired').not().isEmpty(),
		],
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const {
			title,
			company,
			location,
			from,
			to,
			current,
			description,
		} = req.body;

		const newExp = {
			title,
			company,
			location,
			from,
			to,
			current,
			description,
		};

		try {
			const profile = await Profile.findOne({ user: req.user.id });

			// let expArr = profile.experience;
			// expArr = [newExp, ...expArr];
			profile.experience = [newExp, ...profile.experience];
			await profile.save();
			res.json(profile);
		} catch (err) {
			console.error(err.message);
			res.status(500).send('Server error');
		}
	}
);

// @route   Put api/profile/experience/:exp_id
// @desc    update profile experience
// @access  Private

router.put(
	'/experience/:exp_id',
	[
		auth,
		[
			check('title', 'Title is reqired').not().isEmpty(),
			check('company', 'Company is reqired').not().isEmpty(),
			check('from', 'From date is reqired').not().isEmpty(),
		],
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		//get the new form data in the request body
		const {
			title,
			company,
			location,
			from,
			to,
			current,
			description,
		} = req.body;

		const newExp = {
			title,
			company,
			location,
			from,
			to,
			current,
			description,
		};

		try {
			let profile = await Profile.findOne({ user: req.user.id });

			let excludedExp = profile.experience.filter(exp => {
				return exp.id !== req.params.exp_id;
			});
			profile.experience = excludedExp;

			profile.experience = [newExp, ...profile.experience];
			await profile.save();
			res.json(profile);
		} catch (err) {
			console.error(err.message);
			res.status(500).send('Server error');
		}
	}
);
//////////////////////////////////////////////////////////////////////////////////////////////
// @route   delete api/profile/experience/:exp_id
// @desc    Delete experience from profile
// @access  Private

router.delete('/experience/:exp_id', auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user.id });

		// Get remove index
		const removeIndex = profile.experience
			.map(item => item.id)
			.indexOf(req.params.exp_id);
		//experience
		profile.experience.splice(removeIndex, 1);

		await profile.save();

		res.json(profile);
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});

////////////////////////////////////////////////////
// @route   Put api/profile/education
// @desc    Add profile education
// @access  Private
router.put(
	'/education',
	[
		auth,
		[
			check('school', 'School is reqired').not().isEmpty(),
			check('degree', 'Degree is reqired').not().isEmpty(),
			check('fieldofstudy', 'Field of study date is reqired').not().isEmpty(),
			check('from', 'From date is reqired').not().isEmpty(),
		],
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const {
			school,
			degree,
			fieldofstudy,
			from,
			to,
			current,
			description,
		} = req.body;

		const newEdu = {
			school,
			degree,
			fieldofstudy,
			from,
			to,
			current,
			description,
		};

		try {
			const profile = await Profile.findOne({ user: req.user.id });

			// let expArr = profile.experience;
			// expArr = [newExp, ...expArr];
			profile.education = [newEdu, ...profile.education];
			await profile.save();

			res.json(profile);
		} catch (err) {
			console.error(err.message);
			res.status(500).send('Server error');
		}
	}
);

// @route   Put api/profile/education/:edu_id
// @desc    Delete education from profile
// @access  Private

router.delete('/education/:edu_id', auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user.id });

		// Get remove index
		const removeIndex = profile.education
			.map(item => item.id)
			.indexOf(req.params.edu_id);
		//education
		profile.education.splice(removeIndex, 1);

		await profile.save();

		res.json(profile);
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});

// @route   GET api/profile/github/:username
// @desc    get user repos from github
// @access  Public

router.get('/github/:username', async (req, res) => {
	try {
		const uri = encodeURI(
			`https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc`
		);
		const headers = {
			'user-agent': 'node.js',
			Authorization: `token ${config.get('githubToken')}`,
		};

		const gitHubResponse = await axios.get(uri, { headers });
		return res.json(gitHubResponse.data);
	} catch (err) {
		console.error(err.message);
		res.status(500).send({ msg: 'No Github profile found.' });
	}
});

module.exports = router;
