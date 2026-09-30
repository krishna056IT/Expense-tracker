const User = require("../models/User");

const PendingUser = require("../models/PendingUser");
const PasswordReset = require("../models/PasswordReset");
const bcrypt = require("bcryptjs");

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
    return res.status(400).json({ message: "All fields required" });
  }

  if (!isValidEmail(email)) {
    return res
      .status(400)
      .json({ message: "Please enter a valid email address" });
  }

  try {
    // Check if an actual account already exists
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists. Please sign in.",
      });
    }

    // Hash password before temporarily storing it
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate OTP
    const code = createVerificationCode();

    // Remove any previous pending signup
    await PendingUser.deleteOne({ email });

    // Create temporary signup record
    const pendingUser = await PendingUser.create({
      fullName,
      email,
      passwordHash,
      profilePicUrl: profilePicUrl || null,
      verificationCodeHash: hashVerificationCode(code),
      verificationCodeExpires: new Date(
        Date.now() + VERIFICATION_CODE_TTL_MS
      ),
    });

    // Send OTP email
    try {
      await sendVerificationCode(pendingUser.email, code);
    } catch (emailError) {
      console.error("EMAIL ERROR:", emailError);
      // If email fails, remove the pending signup
      await PendingUser.deleteOne({ _id: pendingUser._id });

      return res.status(503).json({
        code: "EMAIL_DELIVERY_FAILED",
        message:
          "The verification email could not be sent. Please try again.",
      });
    }

    return res.status(201).json({
      message: "Verification code sent. Check your email.",
      email: pendingUser.email,
      requiresVerification: true,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists. Please sign in.",
      });
    }

    console.error("Register error:", err);

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
  const code =
    typeof req.body.code === "string" ? req.body.code.trim() : "";

  if (!isValidEmail(email) || !/^\d{6}$/.test(code)) {
    return res.status(400).json({
      message: "A valid email and 6-digit code are required",
    });
  }

  try {
    const pendingUser = await PendingUser.findOne({ email });

    if (!pendingUser) {
      return res.status(400).json({
        message:
          "No pending signup found. Please create your account again.",
      });
    }

    // Check OTP expiry
    if (pendingUser.verificationCodeExpires <= new Date()) {
      await PendingUser.deleteOne({ _id: pendingUser._id });

      return res.status(400).json({
        message:
          "The verification code has expired. Please request a new code.",
      });
    }

    // Compare OTP hashes
    const expectedHash = Buffer.from(
      pendingUser.verificationCodeHash,
      "hex"
    );

    const submittedHash = Buffer.from(
      hashVerificationCode(code),
      "hex"
    );

    if (
      expectedHash.length !== submittedHash.length ||
      !crypto.timingSafeEqual(expectedHash, submittedHash)
    ) {
      return res.status(400).json({
        message: "The verification code is incorrect",
      });
    }

    // Double-check that an account wasn't created meanwhile
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      await PendingUser.deleteOne({ _id: pendingUser._id });

      return res.status(409).json({
        message: "An account with this email already exists. Please sign in.",
      });
    }

    // Create the ACTUAL user only after OTP verification
    const user = new User({
      fullName: pendingUser.fullName,
      email: pendingUser.email,
      password: pendingUser.passwordHash,
      profilePicUrl: pendingUser.profilePicUrl,
      isEmailVerified: true,
    });

    // Tell User.js that password is already bcrypt-hashed
    user.$locals.passwordAlreadyHashed = true;

    await user.save();

    // Delete temporary signup
    await PendingUser.deleteOne({
      _id: pendingUser._id,
    });

    return res.status(201).json({
      message: "Email verified and account created successfully",
      id: user._id,
      user: createPublicUser(user),
      token: generateToken(user._id),
    });
  } catch (err) {
    console.error("Verify email error:", err);

    return res.status(500).json({
      message: "Internal server error",
    });
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
exports.updateUserProfile = async (req, res) => {
  const fullName = typeof req.body.fullName === "string" ? req.body.fullName.trim() : "";

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
//for password forget
exports.forgotPassword = async (req, res) => {
  const email = normalizeEmail(req.body.email);

  if (!isValidEmail(email)) {
    return res.status(400).json({
      message: "Please enter a valid email address",
    });
  }

  try {
    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(404).json({
        message: "No account found with this email address",
      });
    }

    const code = createVerificationCode();

    await PasswordReset.deleteMany({ email });

    await PasswordReset.create({
      email,
      resetCodeHash: hashVerificationCode(code),
      resetCodeExpires: new Date(
        Date.now() + VERIFICATION_CODE_TTL_MS
      ),
    });

    await sendVerificationCode(email, code);

    return res.status(200).json({
      message: "Password reset code sent. Check your email.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);

    return res.status(500).json({
      message: "Unable to send password reset code",
    });
  }
};
//verifyResetOTP
exports.verifyResetOTP = async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const code =
    typeof req.body.code === "string" ? req.body.code.trim() : "";

  if (!isValidEmail(email) || !/^\d{6}$/.test(code)) {
    return res.status(400).json({
      message: "A valid email and 6-digit code are required",
    });
  }

  try {
    const resetRequest = await PasswordReset.findOne({ email });

    if (!resetRequest) {
      return res.status(400).json({
        message: "No password reset request found",
      });
    }

    if (resetRequest.resetCodeExpires <= new Date()) {
      await PasswordReset.deleteOne({ _id: resetRequest._id });

      return res.status(400).json({
        message: "The verification code has expired. Please request a new one.",
      });
    }

    const expectedHash = Buffer.from(
      resetRequest.resetCodeHash,
      "hex"
    );

    const submittedHash = Buffer.from(
      hashVerificationCode(code),
      "hex"
    );

    if (
      expectedHash.length !== submittedHash.length ||
      !crypto.timingSafeEqual(expectedHash, submittedHash)
    ) {
      return res.status(400).json({
        message: "The verification code is incorrect",
      });
    }

    return res.status(200).json({
      message: "Code verified successfully",
      email,
    });
  } catch (err) {
    console.error("Verify reset OTP error:", err);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
//resetPassword
exports.resetPassword = async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const newPassword = req.body.newPassword;

  if (!isValidEmail(email) || !newPassword) {
    return res.status(400).json({
      message: "Email and new password are required",
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      message: "Password must be at least 8 characters long",
    });
  }

  try {
    const resetRequest = await PasswordReset.findOne({ email });

    if (!resetRequest) {
      return res.status(400).json({
        message: "Password reset request not found or already used",
      });
    }

    if (resetRequest.resetCodeExpires <= new Date()) {
      await PasswordReset.deleteOne({ _id: resetRequest._id });

      return res.status(400).json({
        message: "Password reset request has expired. Please try again.",
      });
    }

    const user = await findUserByEmail(email);

    if (!user) {
      await PasswordReset.deleteOne({ _id: resetRequest._id });

      return res.status(404).json({
        message: "User account not found",
      });
    }

    user.password = newPassword;
    await user.save();

    await PasswordReset.deleteOne({
      _id: resetRequest._id,
    });

    return res.status(200).json({
      message: "Password reset successfully. You can now login.",
    });
  } catch (err) {
    console.error("Reset password error:", err);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
