const express = require('express');
const { check, validationResult } = require('express-validator');

const auth = require('../../middleware/auth');

const Post = require('../../models/Post');
const User = require('../../models/User');

const router = express.Router();

// @route    POST api/posts
// @desc     Create a post
// @access   Private

router.post(
	'/',
	[auth, [check('text', 'Text is required').not().isEmpty()]],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({
				errors: errors.array(),
			});
		}

		try {
			const user = await User.findById(req.user.id).select('-password');

			const newPost = {
				text: req.body.text,
				name: user.name,
				avatar: user.avatar,
				user: req.user.id,
			};

			const post = await Post.create(newPost);

			res.json(post);
		} catch (err) {
			console.error(err.message);
			return res.status(500).send('Server Error');
		}
	}
);

// @route    Get api/posts
// @desc     get all posts
// @access   Private

router.get('/', auth, async (req, res) => {
	try {
		const posts = await Post.find().sort({ date: -1 });

		res.send(posts);
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});

// @route    Get api/posts/:id
// @desc     get post by id
// @access   Private

router.get('/:id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);
		if (!post) {
			return res.status(400).json({ msg: 'Post not found' });
		}
		res.send(post);
	} catch (err) {
		console.error(err.message);
		if (err.kind === 'ObjectId') {
			return res.status(404).json({ msg: 'Post not found' });
		}
		res.status(500).send('Server Error');
	}
});

// @route    DELETE api/posts/:id
// @desc     delete post by id
// @access   Private

router.delete('/:id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);
		if (!post) {
			return res.status(400).json({ msg: 'Post not found' });
		}

		// Check user
		if (post.user.toString() !== req.user.id) {
			return res.status(401).json({ msg: 'User not authorized' });
		}
		await Post.deleteOne(post);
		res.json({ msg: 'Post removed' });
	} catch (err) {
		console.error(err.message);
		if (err.kind === 'ObjectId') {
			return res.status(404).json({ msg: 'Post not found' });
		}
		res.status(500).send('Server Error');
	}
});

// @route    Put api/posts/:id
// @desc     update post by id
// @access   Private

router.put('/:id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);
		const user = await User.findById(req.user.id);

		// find if alreadyLiked
		const alreadyLiked = post.likes.some(
			(like) => like.user.toString() === user.id
		);

		if (alreadyLiked) {
			// Each "Like.user" is an object that we have to call toString on in order to compare to user.id
			post.likes = post.likes.filter((like) => {
				return like.user.toString() !== user.id;
			});
			await post.save();
			return res.send(post.likes);
		}
		post.likes.unshift({ user: req.user.id });
		await post.save();
		res.send(post.likes);
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});

// @route    get api/posts/:id/likes
// @desc     Get the number of likes a post has
// @access   Private

router.get('/:id/likes', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);
		const likes = post.likes.length;
		res.json({ likes: likes });
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});

// @route    POST api/posts/comment/:id
// @desc     Create a comment on a post
// @access   Private

router.post(
	'/comment/:id',
	[auth, [check('text', 'Text is required').not().isEmpty()]],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({
				errors: errors.array(),
			});
		}

		try {
			const user = await User.findById(req.user.id).select('-password');
			const post = await Post.findById(req.params.id);

			const newComment = {
				text: req.body.text,
				name: user.name,
				avatar: user.avatar,
				user: req.user.id,
			};

			post.comments.unshift(newComment);

			await post.save();

			res.json(post.comments);
		} catch (err) {
			console.error(err.message);
			return res.status(500).send('Server Error');
		}
	}
);

// router.post('/comment/:id', auth, async (req, res) => {
// 	try {
// 		const post = await Post.findById(req.params.id);
// 		const { user, text, name, avatar, date } = req.body;

// 		// post.comments = [postParams, ...post.comments];
// 		res.send(post);
// 	} catch (err) {
// 		console.error(err.message);
// 		res.status(500).json({ msg: 'Server error' });
// 	}
// });
module.exports = router;
