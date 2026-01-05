import express from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

const STORAGE_LIMIT_BYTES = 524288000; // 500 MB

// Helper: get or create vault + AI Outputs system folder
const getOrCreateVaultForUser = async (userId) => {
  let vault = await prisma.vault.findUnique({
    where: { userId },
  });

  if (!vault) {
    vault = await prisma.vault.create({
      data: {
        userId,
        storageUsed: 0,
        storageLimit: STORAGE_LIMIT_BYTES,
      },
    });
  }

  // Ensure AI Outputs system folder exists
  const existingSystemFolder = await prisma.vaultFolder.findFirst({
    where: {
      vaultId: vault.id,
      isSystemFolder: true,
      name: "AI Outputs",
      parentId: null,
    },
  });

  if (!existingSystemFolder) {
    await prisma.vaultFolder.create({
      data: {
        vaultId: vault.id,
        name: "AI Outputs",
        isSystemFolder: true,
        parentId: null,
      },
    });
  }

  return vault;
};

// GET /api/vault - Get user's vault with root folders
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const vault = await getOrCreateVaultForUser(userId);

    const rootFolders = await prisma.vaultFolder.findMany({
      where: {
        vaultId: vault.id,
        parentId: null,
      },
      orderBy: { createdAt: "asc" },
    });

    res.json({
      vault: {
        id: vault.id,
        storageUsed: vault.storageUsed,
        storageLimit: vault.storageLimit,
        createdAt: vault.createdAt,
      },
      rootFolders,
    });
  } catch (error) {
    console.error("Error fetching vault:", error);
    res.status(500).json({ error: "Failed to fetch vault" });
  }
});

// POST /api/vault/folders - Create folder
router.post("/folders", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, parentId } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Folder name is required" });
    }

    const vault = await getOrCreateVaultForUser(userId);

    let parentFolder = null;
    if (parentId) {
      parentFolder = await prisma.vaultFolder.findFirst({
        where: {
          id: parentId,
          vaultId: vault.id,
        },
      });

      if (!parentFolder) {
        return res.status(404).json({ error: "Parent folder not found" });
      }
    }

    const folder = await prisma.vaultFolder.create({
      data: {
        vaultId: vault.id,
        parentId: parentFolder ? parentFolder.id : null,
        name: name.trim(),
        isSystemFolder: false,
      },
    });

    res.status(201).json(folder);
  } catch (error) {
    console.error("Error creating folder:", error);
    res.status(500).json({ error: "Failed to create folder" });
  }
});

// PATCH /api/vault/folders/:id - Rename folder
router.patch("/folders/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Folder name is required" });
    }

    const vault = await getOrCreateVaultForUser(userId);

    const folder = await prisma.vaultFolder.findFirst({
      where: {
        id,
        vaultId: vault.id,
      },
    });

    if (!folder) {
      return res.status(404).json({ error: "Folder not found" });
    }

    if (folder.isSystemFolder) {
      return res
        .status(400)
        .json({ error: "System folders cannot be renamed" });
    }

    const updated = await prisma.vaultFolder.update({
      where: { id: folder.id },
      data: { name: name.trim() },
    });

    res.json(updated);
  } catch (error) {
    console.error("Error renaming folder:", error);
    res.status(500).json({ error: "Failed to rename folder" });
  }
});

// DELETE /api/vault/folders/:id - Delete folder (cascade files)
router.delete("/folders/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const vault = await getOrCreateVaultForUser(userId);

    const folder = await prisma.vaultFolder.findFirst({
      where: {
        id,
        vaultId: vault.id,
      },
    });

    if (!folder) {
      return res.status(404).json({ error: "Folder not found" });
    }

    if (folder.isSystemFolder) {
      return res
        .status(400)
        .json({ error: "System folders cannot be deleted" });
    }

    await prisma.vaultFolder.delete({
      where: { id: folder.id },
    });

    res.json({ message: "Folder deleted successfully" });
  } catch (error) {
    console.error("Error deleting folder:", error);
    res.status(500).json({ error: "Failed to delete folder" });
  }
});

// GET /api/vault/folders/:id - Get folder contents
router.get("/folders/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const vault = await getOrCreateVaultForUser(userId);

    const folder = await prisma.vaultFolder.findFirst({
      where: {
        id,
        vaultId: vault.id,
      },
    });

    if (!folder) {
      return res.status(404).json({ error: "Folder not found" });
    }

    const [subfolders, files] = await Promise.all([
      prisma.vaultFolder.findMany({
        where: { parentId: folder.id },
        orderBy: { createdAt: "asc" },
      }),
      prisma.vaultFile.findMany({
        where: { folderId: folder.id },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    res.json({ folder, subfolders, files });
  } catch (error) {
    console.error("Error fetching folder contents:", error);
    res.status(500).json({ error: "Failed to fetch folder contents" });
  }
});

// DELETE /api/vault/files/:id - Delete file
router.delete("/files/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const vault = await getOrCreateVaultForUser(userId);

    const file = await prisma.vaultFile.findUnique({
      where: { id },
      include: {
        folder: true,
      },
    });

    if (!file || file.folder.vaultId !== vault.id) {
      return res.status(404).json({ error: "File not found" });
    }

    await prisma.$transaction([
      prisma.vaultFile.delete({
        where: { id: file.id },
      }),
      prisma.vault.update({
        where: { id: vault.id },
        data: {
          storageUsed: {
            decrement: file.size,
          },
        },
      }),
    ]);

    // NOTE: Actual R2 object deletion can be added here in a future issue

    res.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ error: "Failed to delete file" });
  }
});

// GET /api/vault/storage - Get storage usage
router.get("/storage", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const vault = await getOrCreateVaultForUser(userId);

    res.json({
      storageUsed: vault.storageUsed,
      storageLimit: vault.storageLimit,
      remaining: Math.max(vault.storageLimit - vault.storageUsed, 0),
    });
  } catch (error) {
    console.error("Error fetching storage usage:", error);
    res.status(500).json({ error: "Failed to fetch storage usage" });
  }
});

export default router;
