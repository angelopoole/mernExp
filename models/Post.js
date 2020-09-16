const mongoose = require('mongoose');

const { Schema } = mongoose;

const postSchema = new Schema({
	user: {
		type: Schema.Types.ObjectId,
		ref: 'users',
	},
	text: {
		type: String,
		required: true,
	},
	name: {
		type: String,
		required: true,
	},
	avatar: {
		type: String,
		required: true,
	},
	likes: [
		{
			user: {
				type: Schema.Types.ObjectId,
				ref: 'users',
			},
		},
	],
	comments: [
		{
			user: {
				type: Schema.Types.ObjectId,
				ref: 'users',
			},
			text: {
				type: String,
				required: true,
			},
			name: {
				type: String,
				required: true,
			},
			avatar: {
				type: String,
				required: true,
			},
			date: {
				type: Date,
				default: Date.now,
			},
		},
	],
});

// eslint-disable-next-line no-multi-assign, no-undef
module.exports = Post = mongoose.model('post', postSchema);
