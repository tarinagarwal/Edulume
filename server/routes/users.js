import express from "express";
import prisma from "../db.js";

const router = express.Router();

// GET current logged-in user (basic profile)
router.get("/me", async (req, res) => {
  try {
    // ⚠️ TEMP: auth ke bina (PR-1 scope)
    // Later PR me req.user use hoga

    const user = await prisma.user.findFirst({
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("GET /users/me error:", error);
    res.status(500).json({ message: "Failed to fetch user profile" });
  }
});

export default router;
