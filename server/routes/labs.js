import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middleware/auth.js"; // existing JWT middleware

const router = express.Router();
const prisma = new PrismaClient();

// --- CREATE Lab ---
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { title, description, language, difficulty, content, starterCode, tasks, testCases, solution, visibility } = req.body;

    const lab = await prisma.lab.create({
      data: {
        title,
        description,
        language,
        difficulty,
        content,
        starterCode,
        tasks,
        testCases,
        solution,
        visibility,
        creatorId: req.user.id, // from JWT
      },
    });

    res.status(201).json(lab);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create lab" });
  }
});

// --- GET ALL Labs ---
router.get("/", async (req, res) => {
  try {
    const labs = await prisma.lab.findMany({
      include: {
        creator: true,
        shares: true,
        progress: true,
      },
    });
    res.json(labs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch labs" });
  }
});

// --- GET SINGLE Lab ---
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const lab = await prisma.lab.findUnique({
      where: { id },
      include: {
        creator: true,
        shares: true,
        progress: true,
      },
    });
    if (!lab) return res.status(404).json({ error: "Lab not found" });
    res.json(lab);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch lab" });
  }
});

// --- UPDATE Lab ---
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.lab.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Lab not found" });

    if (existing.creatorId !== req.user.id) return res.status(403).json({ error: "Forbidden" });

    const lab = await prisma.lab.update({
      where: { id },
      data: req.body,
    });

    res.json(lab);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update lab" });
  }
});

// --- DELETE Lab ---
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.lab.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Lab not found" });

    if (existing.creatorId !== req.user.id) return res.status(403).json({ error: "Forbidden" });

    await prisma.lab.delete({ where: { id } });
    res.json({ message: "Lab deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete lab" });
  }
});

export default router;
