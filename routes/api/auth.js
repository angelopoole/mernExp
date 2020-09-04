const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User');

// @route   Get api/auth
// @desc    Test route
// @access  Public

// adding auth to the parameters makes it a protected route

router.get('/', auth, async (req, res) => {
  // in the auth middleware we set req.user to decoded.user so now we have access to req.user.id
  try {
    const user = await (await User.findById(req.user.id)).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
