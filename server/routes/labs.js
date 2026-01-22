import express from "express";
import prisma from "../db.js";
import { isValidObjectId } from "../utils/validator.js";
import { authenticateToken } from "../middleware/auth.js"; // existing JWT middleware

const router = express.Router();


const ALLOWED_DIFFICULTIES = ["beginner", "intermediate", "advanced"];
const ALLOWED_VISIBILITY = ["private", "public", "link"];

// --- CREATE Lab ---
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
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
      } = req.body;


    //Required fields validation
    if (!title || !language || !difficulty) {
      return res.status(400).json({
        error: "title, language, and difficulty are required",
      });
    }

     // Difficulty enum validation
     if (!ALLOWED_DIFFICULTIES.includes(difficulty)) {
      return res.status(400).json({
        error: "Invalid difficulty value",
        allowedValues: ALLOWED_DIFFICULTIES,
      });
    }

     // Visibility enum validation
    if (visibility && !ALLOWED_VISIBILITY.includes(visibility)) {
      return res.status(400).json({
        error: "Invalid visibility value",
        allowedValues: ALLOWED_VISIBILITY,
      });
    }
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
        creatorId: req.user.id,
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
    const { language, difficulty, creator } = req.query;

    const where = {};
    if (language) where.language = language;
    if (difficulty) where.difficulty = difficulty;
    if (creator) where.creatorId = creator;

    const labs = await prisma.lab.findMany({
     where,
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
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid lab ID" });
    }
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
   if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid lab ID" });
    }
    const existing = await prisma.lab.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Lab not found" });

    if (existing.creatorId !== req.user.id) return res.status(403).json({ error: "Forbidden" });

  const {
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
} = req.body;

if (difficulty && !ALLOWED_DIFFICULTIES.includes(difficulty)) {
  return res.status(400).json({ error: "Invalid difficulty value" });
}

if (visibility && !ALLOWED_VISIBILITY.includes(visibility)) {
  return res.status(400).json({ error: "Invalid visibility value" });
}

const lab = await prisma.lab.update({
  where: { id },
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
  },
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
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid lab ID" });
    }
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
