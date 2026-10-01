const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

const isValidEmail = (email) => EMAIL_PATTERN.test(email);

const findUserByEmail = async (email) => {
  const exactMatch = await User.findOne({ email });
  if (exactMatch) return exactMatch;

  const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return User.findOne({
    email: { $regex: `^\\s*${escapedEmail}\\s*$`, $options: "i" },
  });
};

const createPublicUser = (user) => {
  const publicUser = user.toObject();
  delete publicUser.password;
  return publicUser;
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "3h" });
};

exports.registerUser = async (req, res) => {
  const { fullName, password, confirmPassword, profilePicUrl } = req.body;
  const email = normalizeEmail(req.body.email);

  if (!fullName || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: "All fields required" });
  }

  if (!isValidEmail(email)) {
    return res
      .status(400)
      .json({ message: "Please enter a valid email address" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists. Please sign in.",
      });
    }

    const user = new User({
      fullName,
      email,
      password,
      profilePicUrl: profilePicUrl || null,
    });

    await user.save();

    return res.status(201).json({
      message: "User registered successfully",
      user: createPublicUser(user),
      token: generateToken(user._id),
    });
  } catch (err) {
    console.error("REGISTER_ERROR", {
      email,
      message: err.message,
    });

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

exports.loginUser = async (req, res) => {
  const { password } = req.body;
  const email = normalizeEmail(req.body.email);

  if (!email || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Please enter a valid email address" });
  }

  try {
    const user = await findUserByEmail(email);
    const passwordMatches = user ? await user.comparePassword(password) : false;

    if (!user || !passwordMatches) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    return res.status(200).json({
      message: "Logged In successfully",
      id: user._id,
      user: createPublicUser(user),
      token: generateToken(user._id),
    });
  } catch (err) {
    console.error("LOGIN_ERROR", {
      email,
      message: err.message,
    });

    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

exports.getUserInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(createPublicUser(user));
  } catch (err) {
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

exports.updateUserProfile = async (req, res) => {
  const fullName =
    typeof req.body.fullName === "string" ? req.body.fullName.trim() : "";

  if (!fullName) {
    return res.status(400).json({ message: "Full name is required" });
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { fullName },
      { new: true, runValidators: true, select: "fullName email profilePicUrl" }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
};
