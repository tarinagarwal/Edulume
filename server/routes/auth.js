import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../db.js";
import { generateOTP, sendOTPEmail, isOTPEnabled } from "../utils/email.js";

const router = express.Router();

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

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
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }
    }

    // For password reset, check if email exists
    if (type === "reset") {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      if (!existingUser) {
        return res.status(400).json({ error: "Email not found" });
      }
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    await prisma.otp.create({
      data: {
        email,
        otpCode: otp,
        otpType: type,
        expiresAt,
      },
    });

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
    const otpRecord = await prisma.otp.findFirst({
      where: {
        email,
        otpCode: otp,
        otpType: type,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Mark OTP as used
    await prisma.otp.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

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

    console.log("🔐 Signup attempt:", { username, email });

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

      const otpRecord = await prisma.otp.findFirst({
        where: {
          email,
          otpCode: otp,
          otpType: "signup",
          used: false,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (!otpRecord) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }

      // Mark OTP as used
      await prisma.otp.update({
        where: { id: otpRecord.id },
        data: { used: true },
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        isVerified: true,
      },
    });

    if (!user) {
      console.error("❌ Failed to create user");
      return res.status(500).json({ error: "Failed to create user account" });
    }
    const token = generateToken(user);

    console.log("✅ User created successfully:", { userId: user.id, username });

    res.status(201).json({
      token,
      user: { id: user.id, username, email },
    });
  } catch (error) {
    console.error("❌ Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

    console.log("🔐 Login attempt:", { usernameOrEmail });

    if (!usernameOrEmail || !password) {
      return res
        .status(400)
        .json({ error: "Username/Email and password are required" });
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
      },
    });

    if (!user) {
      console.log("❌ User not found:", { usernameOrEmail });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if user is verified (only if OTP is enabled)
    if (isOTPEnabled() && !user.isVerified) {
      return res.status(401).json({ error: "Please verify your email first" });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      console.log("❌ Invalid password for user:", { userId: user.id });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user);

    console.log("✅ Login successful:", {
      userId: user.id,
      username: user.username,
    });

    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (error) {
    console.error("❌ Login error:", error);
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
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return res.status(400).json({ error: "Email not found" });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    await prisma.otp.create({
      data: {
        email,
        otpCode: otp,
        otpType: "reset",
        expiresAt,
      },
    });

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
    const otpRecord = await prisma.otp.findFirst({
      where: {
        email,
        otpCode: otp,
        otpType: "reset",
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Hash new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    });

    // Mark OTP as used
    await prisma.otp.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Logout (now just a client-side operation)
router.post("/logout", (req, res) => {
  try {
    console.log("🚪 Logout request received");
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user profile
router.get("/profile", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    console.log(
      "🔍 Profile request - Auth header:",
      authHeader ? "Present" : "Missing"
    );

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ No valid authorization header");
      return res.status(401).json({ error: "Access token required" });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    console.log("🔍 Extracted token:", token ? "Present" : "Missing");

    if (!token) {
      console.log("❌ No token found");
      return res.status(401).json({ error: "Access token required" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("✅ Token verified successfully:", {
        userId: decoded.userId,
      });
    } catch (jwtError) {
      console.log("❌ JWT verification failed:", jwtError.message);
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      console.log("❌ User not found in database:", { userId: decoded.userId });
      return res.status(401).json({ error: "User not found" });
    }

    console.log("✅ Profile retrieved successfully:", {
      userId: user.id,
      username: user.username,
    });

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.createdAt,
      },
    });
  } catch (error) {
    console.error("❌ Profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
