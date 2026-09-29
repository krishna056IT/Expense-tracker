const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendVerificationCode } = require("../utils/emailService");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VERIFICATION_CODE_TTL_MS = 10 * 60 * 1000;

const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

const isValidEmail = (email) => EMAIL_PATTERN.test(email);

const hashVerificationCode = (code) =>
  crypto.createHash("sha256").update(code).digest("hex");

const createVerificationCode = () =>
  crypto.randomInt(0, 1000000).toString().padStart(6, "0");

const findUserByEmail = async (email) => {
  const exactMatch = await User.findOne({ email });
  if (exactMatch) return exactMatch;

  const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return User.findOne({
    email: { $regex: `^\\s*${escapedEmail}\\s*$`, $options: "i" },
  });
};

const sendNewVerificationCode = async (user) => {
  const code = createVerificationCode();
  user.emailVerificationTokenHash = hashVerificationCode(code);
  user.emailVerificationExpires = new Date(Date.now() + VERIFICATION_CODE_TTL_MS);
  await user.save();
  await sendVerificationCode(user.email, code);
};

const createPublicUser = (user) => {
  const publicUser = user.toObject();
  delete publicUser.password;
  delete publicUser.emailVerificationTokenHash;
  delete publicUser.emailVerificationExpires;
  return publicUser;
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "3h" });
};

exports.registerUser = async (req, res) => {
  const { fullName, password, profilePicUrl } = req.body;
  const email = normalizeEmail(req.body.email);

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: `All fields required` });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Please enter a valid email address" });
  }

  let user;
  try {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists. Please sign in.",
      });
    }

    user = await User.create({
      fullName,
      email,
      password,
      profilePicUrl,
      isEmailVerified: false,
    });

    try {
      await sendNewVerificationCode(user);
    } catch (emailError) {
      return res.status(503).json({
        code: "EMAIL_DELIVERY_FAILED",
        message:
          "Your account was created, but the verification email could not be sent. Please try resending it.",
      });
    }

    return res.status(201).json({
      message: "Verification code sent. Check your email to complete signup.",
      email: user.email,
      requiresVerification: true,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists. Please sign in.",
      });
    }
    return res.status(500).json({ message: "Internal server error" });
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
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: `Invalid credentials` });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        code: "EMAIL_NOT_VERIFIED",
        message: "Please verify your email before signing in.",
        email: user.email,
      });
    }

    if (user.email !== email) {
      user.email = email;
      await user.save();
    }

    res.status(200).json({
      message: "Logged In successfully",
      id: user._id,
      user: createPublicUser(user),
      token: generateToken(user._id),
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: `Internal server error`, error: err.message });
  }
};

exports.verifyEmail = async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const code = typeof req.body.code === "string" ? req.body.code.trim() : "";

  if (!isValidEmail(email) || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ message: "A valid email and 6-digit code are required" });
  }

  try {
    const user = await User.findOne({ email }).select(
      "+emailVerificationTokenHash +emailVerificationExpires"
    );

    if (
      !user ||
      user.isEmailVerified ||
      !user.emailVerificationTokenHash ||
      !user.emailVerificationExpires ||
      user.emailVerificationExpires <= new Date()
    ) {
      return res.status(400).json({
        message: "The verification code is invalid or has expired. Request a new code.",
      });
    }

    const expectedHash = Buffer.from(user.emailVerificationTokenHash, "hex");
    const submittedHash = Buffer.from(hashVerificationCode(code), "hex");
    if (
      expectedHash.length !== submittedHash.length ||
      !crypto.timingSafeEqual(expectedHash, submittedHash)
    ) {
      return res.status(400).json({ message: "The verification code is incorrect" });
    }

    const verifiedUser = await User.findOneAndUpdate(
      {
        _id: user._id,
        isEmailVerified: false,
        emailVerificationTokenHash: user.emailVerificationTokenHash,
        emailVerificationExpires: { $gt: new Date() },
      },
      {
        $set: { isEmailVerified: true },
        $unset: {
          emailVerificationTokenHash: "",
          emailVerificationExpires: "",
        },
      },
      { new: true }
    );

    if (!verifiedUser) {
      return res.status(400).json({
        message: "The verification code is invalid or has expired. Request a new code.",
      });
    }

    return res.status(200).json({
      message: "Email verified successfully",
      id: verifiedUser._id,
      user: createPublicUser(verifiedUser),
      token: generateToken(verifiedUser._id),
    });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.resendVerification = async (req, res) => {
  const email = normalizeEmail(req.body.email);
  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Please enter a valid email address" });
  }

  try {
    const user = await User.findOne({ email }).select(
      "+emailVerificationTokenHash +emailVerificationExpires"
    );

    if (!user || user.isEmailVerified) {
      return res.status(200).json({
        message: "If an unverified account exists, a verification code has been sent.",
      });
    }

    try {
      await sendNewVerificationCode(user);
    } catch (emailError) {
      return res.status(503).json({
        code: "EMAIL_DELIVERY_FAILED",
        message: "The verification email could not be sent. Please try again later.",
      });
    }

    return res.status(200).json({ message: "A new verification code has been sent." });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
};
exports.getUserInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json(user);
  } catch (err) {
    return res
      .status(500)
      .json({ message: `Internal server error`, error: err.message });
  }
};
