import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { dbGet, dbRun } from "../db.js";
import { generateOTP, sendOTPEmail, isOTPEnabled } from "../utils/email.js";

const router = express.Router();

// Send OTP for signup
router.post("/send-otp", async (req, res) => {
  try {
    const { email, type = "signup" } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Check if OTP is enabled
    if (!isOTPEnabled()) {
      return res.json({
        message: "OTP verification is disabled in development mode",
      });
    }

    // For signup, check if email already exists
    if (type === "signup") {
      const existingUser = await dbGet("SELECT id FROM users WHERE email = ?", [
        email,
      ]);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }
    }

    // For password reset, check if email exists
    if (type === "reset") {
      const existingUser = await dbGet("SELECT id FROM users WHERE email = ?", [
        email,
      ]);
      if (!existingUser) {
        return res.status(400).json({ error: "Email not found" });
      }
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    await dbRun(
      "INSERT INTO otps (email, otp_code, otp_type, expires_at) VALUES (?, ?, ?, ?)",
      [email, otp, type, expiresAt.toISOString()]
    );

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp, type);
    if (!emailSent) {
      return res.status(500).json({ error: "Failed to send OTP email" });
    }

    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Send OTP error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp, type = "signup" } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    // Check if OTP is enabled
    if (!isOTPEnabled()) {
      return res.json({
        verified: true,
        message: "OTP verification is disabled in development mode",
      });
    }

    // Find valid OTP
    const otpRecord = await dbGet(
      'SELECT * FROM otps WHERE email = ? AND otp_code = ? AND otp_type = ? AND used = 0 AND expires_at > datetime("now") ORDER BY created_at DESC LIMIT 1',
      [email, otp, type]
    );

    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Mark OTP as used
    await dbRun("UPDATE otps SET used = 1 WHERE id = ?", [otpRecord.id]);

    res.json({ verified: true, message: "OTP verified successfully" });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Sign up
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password, otp } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: "Username, email, and password are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }

    // Verify OTP if enabled
    if (isOTPEnabled()) {
      if (!otp) {
        return res.status(400).json({ error: "OTP is required" });
      }

      const otpRecord = await dbGet(
        'SELECT * FROM otps WHERE email = ? AND otp_code = ? AND otp_type = "signup" AND used = 0 AND expires_at > datetime("now") ORDER BY created_at DESC LIMIT 1',
        [email, otp]
      );

      if (!otpRecord) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }

      // Mark OTP as used
      await dbRun("UPDATE otps SET used = 1 WHERE id = ?", [otpRecord.id]);
    }

    // Check if user already exists
    const existingUser = await dbGet(
      "SELECT id FROM users WHERE username = ?",
      [username]
    );
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // Check if email already exists
    const existingEmail = await dbGet("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    if (existingEmail) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await dbRun(
      "INSERT INTO users (username, email, password_hash, is_verified) VALUES (?, ?, ?, ?)",
      [username, email, passwordHash, isOTPEnabled() ? 1 : 1] // Always verified since OTP was checked above
    );

    // Generate JWT
    const token = jwt.sign(
      { userId: result.id, username, email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: { id: result.id, username, email },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      return res
        .status(400)
        .json({ error: "Username/Email and password are required" });
    }

    // Find user
    const user = await dbGet(
      "SELECT id, username, email, password_hash, is_verified FROM users WHERE username = ? OR email = ?",
      [usernameOrEmail, usernameOrEmail]
    );
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if user is verified (only if OTP is enabled)
    if (isOTPEnabled() && !user.is_verified) {
      return res.status(401).json({ error: "Please verify your email first" });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Forgot password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Check if user exists
    const user = await dbGet("SELECT id FROM users WHERE email = ?", [email]);
    if (!user) {
      return res.status(400).json({ error: "Email not found" });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    await dbRun(
      "INSERT INTO otps (email, otp_code, otp_type, expires_at) VALUES (?, ?, ?, ?)",
      [email, otp, "reset", expiresAt.toISOString()]
    );

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp, "reset");
    if (!emailSent) {
      return res.status(500).json({ error: "Failed to send reset email" });
    }

    res.json({ message: "Password reset code sent to your email" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Reset password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res
        .status(400)
        .json({ error: "Email, OTP, and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }

    // Verify OTP
    const otpRecord = await dbGet(
      'SELECT * FROM otps WHERE email = ? AND otp_code = ? AND otp_type = "reset" AND used = 0 AND expires_at > datetime("now") ORDER BY created_at DESC LIMIT 1',
      [email, otp]
    );

    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Hash new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    await dbRun("UPDATE users SET password_hash = ? WHERE email = ?", [
      passwordHash,
      email,
    ]);

    // Mark OTP as used
    await dbRun("UPDATE otps SET used = 1 WHERE id = ?", [otpRecord.id]);

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user profile
router.get("/profile", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await dbGet(
      "SELECT id, username, email, created_at FROM users WHERE id = ?",
      [decoded.userId]
    );

    if (!user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(403).json({ error: "Invalid or expired token" });
  }
});

export default router;
