import jwt from "jsonwebtoken";
import { dbGet } from "../db.js";

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    console.log(
      "🔍 Auth middleware - Header:",
      authHeader ? "Present" : "Missing",
      "Path:",
      req.path
    );

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ No valid authorization header");
      return res.status(401).json({ error: "Access token required" });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      console.log("❌ No token found");
      return res.status(401).json({ error: "Access token required" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("✅ Token verified in middleware:", {
        userId: decoded.userId,
      });
    } catch (jwtError) {
      console.log(
        "❌ JWT verification failed in middleware:",
        jwtError.message
      );
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Verify user still exists
    const user = await dbGet(
      "SELECT id, username, email FROM users WHERE id = ?",
      [decoded.userId]
    );

    if (!user) {
      console.log("❌ User not found in middleware:", {
        userId: decoded.userId,
      });
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user;
    console.log("✅ User authenticated in middleware:", {
      userId: user.id,
      username: user.username,
    });
    next();
  } catch (error) {
    console.error("❌ Auth middleware error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
