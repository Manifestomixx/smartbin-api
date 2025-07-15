const User = require('../model/user');


// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const updates = (({ firstName, lastName, phone }) => ({ firstName, lastName, phone }))(req.body);
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Get all users with optional category filter
exports.getUsersByCategory = async (req, res) => {
    try {
      const { category } = req.params;
      if (!['resident', 'corporate', 'agent'].includes(category)) {
        return res.status(400).json({ message: 'Invalid category filter' });
      }
  
      const users = await User.find({ category }).select('-password');
      res.json({ count: users.length, users });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
