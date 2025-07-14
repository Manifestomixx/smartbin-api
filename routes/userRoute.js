const express = require('express');
const {
  getProfile,
  updateProfile,
  getUsersByCategory
} = require('../controller/userController');
const { auth } = require('../middleware/auth');

const router = express.Router();


router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.get('/category/:category', auth, getUsersByCategory);

module.exports = router;
