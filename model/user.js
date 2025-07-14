const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");


const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: [true, "Phone number already exists"],
      validate(value) {
        if (!validator.isMobilePhone(value, "any", { strictMode: false })) {
          throw new Error("Invalid phone number");
        }
      },
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: [true, "Email already exists"],
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid email address");
        }
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      validator: function (value) {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value);
      },
      message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
    },

    category: {
      type: String,
      enum: ["resident", "corporate", "agent"],
      required: [true, "User category is required"],
      default: "resident",
    },

    walletBalance: {
      type: Number,
      default: 0,
      min: [0, "Wallet balance cannot be negative"]
    },

    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Generate JWT
userSchema.methods.generateToken = async function () {
  return jwt.sign(
    { userId: this._id, userName: this.userName },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Generate reset password token
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 mins
  return resetToken;
};

const USER = mongoose.model("User", userSchema);
module.exports = USER;
