const User =  require('../model/user');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Utils: send token
const sendToken = (user, statusCode, res) => {
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });
  
    res.status(statusCode).json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
      },
    });
  };
  
  // Register new user
  exports.register = async (req, res) => {
      try {
          const { firstName, lastName, email, phone, password, category } = req.body;

            if (!firstName || !lastName || !email || !phone || !password || !category) {
            return res.status(400).json({ message: 'Please provide all required fields' });
            }

          const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
          if (existingUser) {
            return res.status(400).json({ message: 'User already exists with email or phone' });
          }
      
          if (!['resident', 'corporate', 'agent'].includes(category)) {
            return res.status(400).json({ message: 'Invalid category type' });
          }
      
          const user = await User.create({ firstName, lastName, email, phone, password, category });
          sendToken(user, 201, res);

        } catch (error) {
          res.status(500).json({ message: error.message });
        }
  };
  
  // Login user
  exports.login = async (req, res) => {
    try {
      const { email, phone, password } = req.body;
  
      if ((!email && !phone) || !password) {
        return res.status(400).json({ message: 'Please provide email/phone and password' });
      }
  
      const user = await User.findOne({
        $or: [{ email: email.toLowerCase() }, { phone }],
      });
  
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
  
      sendToken(user, 200, res);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  // Forgot password
exports.forgotPassword = async (req, res) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      const resetToken = user.getResetPasswordToken();
      await user.save({ validateBeforeSave: false });
  
      // You’d send this link via email in production
      const resetUrl = `${req.protocol}://${req.get('host')}/api/users/reset-password/${resetToken}`;
  
      res.json({ message: 'Reset link generated', resetUrl });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  // Reset password
  exports.resetPassword = async (req, res) => {
    try {
      const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');
  
      const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
      });
  
      if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }
      
  
      const { newPassword } = req.body;
      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
  
      await user.save();
  
      res.json({ message: 'Password reset successful' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };