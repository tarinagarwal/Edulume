import express from 'express';
import multer from 'multer';
import prisma from "../db.js";
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { authenticateToken } from '../middleware/auth.js';
import { parseResume } from '../utils/resumeParser.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Configure S3 client for Cloudflare R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = 'alienvault-storage';

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'text/plain'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and TXT files are allowed.'));
    }
  }
});

/**
 * Upload resume file to Cloudflare R2
 */
async function uploadResumeToR2(buffer, filename, mimetype) {
  try {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const uniqueFilename = `resumes/${timestamp}-${filename}`;

    // Upload to Cloudflare R2
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: uniqueFilename,
      Body: buffer,
      ContentType: mimetype,
    });

    await s3Client.send(uploadCommand);

    // Generate public URL
    const publicUrl = `https://pub-${process.env.R2_UPLOAD_URL_ID}.r2.dev/${uniqueFilename}`;

    return publicUrl;
  } catch (error) {
    console.error('Error uploading resume to R2:', error);
    throw new Error('Failed to upload resume to storage');
  }
}

/**
 * POST /api/interviews/upload-resume
 * Upload and parse candidate resume
 */
router.post('/upload-resume', authenticateToken, upload.single('resume'), async (req, res) => {
    try {
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded. Please provide a resume file.'
        });
      }

      // Get userId from authenticated user
      const userId = req.user.id;

      // Parse the resume
      const parsedData = await parseResume(req.file.buffer, req.file.mimetype);

      // Upload file to R2
      const resumeUrl = await uploadResumeToR2(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      // Save to database
      const candidate = await prisma.interviewCandidate.create({
        data: {
          userId,
          name: parsedData.name,
          role: parsedData.role,
          skills: parsedData.skills,
          yearsOfExperience: parsedData.yearsOfExperience,
          resumeUrl,
          parsedData: {
            rawText: parsedData.rawText,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            uploadedAt: new Date().toISOString()
          }
        }
      });

      // Return success response
      res.status(201).json({
        success: true,
        data: {
          id: candidate.id,
          name: candidate.name,
          role: candidate.role,
          skills: candidate.skills,
          yearsOfExperience: candidate.yearsOfExperience,
          resumeUrl: candidate.resumeUrl,
          createdAt: candidate.createdAt
        },
        message: 'Resume uploaded and parsed successfully'
      });

    } catch (error) {
      console.error('Resume upload error:', error);

      // Handle specific errors
      if (error.message.includes('file type') ||
          error.message.includes('parse') ||
          error.message.includes('empty')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      // Handle multer errors
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: 'File size too large. Maximum size is 5MB.'
          });
        }
        return res.status(400).json({
          success: false,
          error: 'File upload error: ' + error.message
        });
      }

      // Generic error
      res.status(500).json({
        success: false,
        error: 'Failed to process resume. Please try again.'
      });
    }
  }
);

//Get all candidates for the authenticated user
router.get('/candidates', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;

      const candidates = await prisma.interviewCandidate.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          role: true,
          skills: true,
          yearsOfExperience: true,
          resumeUrl: true,
          createdAt: true
        }
      });

      res.json({
        success: true,
        data: candidates
      });
    } catch (error) {
      console.error('Get candidates error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve candidates'
      });
    }
  }
);


//Get specific candidate details
router.get('/candidates/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const candidate = await prisma.interviewCandidate.findFirst({
        where: {
          id,
          userId
        }
      });

      if (!candidate) {
        return res.status(404).json({
          success: false,
          error: 'Candidate not found'
        });
      }

      res.json({
        success: true,
        data: candidate
      });
    } catch (error) {
      console.error('Get candidate error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve candidate'
      });
    }
  }
);

// Delete a candidate
router.delete('/candidates/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const candidate = await prisma.interviewCandidate.deleteMany({
        where: {
          id,
          userId // Ensure user owns this candidate
        }
      });

      if (candidate.count === 0) {
        return res.status(404).json({
          success: false,
          error: 'Candidate not found'
        });
      }

      res.json({
        success: true,
        message: 'Candidate deleted successfully'
      });
    } catch (error) {
      console.error('Delete candidate error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete candidate'
      });
    }
  }
);

//Update candidate information
router.patch('/candidates/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { name, role, skills, yearsOfExperience } = req.body;

      // Verify candidate exists and belongs to user
      const existingCandidate = await prisma.interviewCandidate.findFirst({
        where: { id, userId }
      });

      if (!existingCandidate) {
        return res.status(404).json({
          success: false,
          error: 'Candidate not found'
        });
      }

      // Update candidate
      const updatedCandidate = await prisma.interviewCandidate.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(role && { role }),
          ...(skills && { skills }),
          ...(yearsOfExperience !== undefined && { yearsOfExperience })
        },
        select: {
          id: true,
          name: true,
          role: true,
          skills: true,
          yearsOfExperience: true,
          resumeUrl: true,
          createdAt: true,
          updatedAt: true
        }
      });

      res.json({
        success: true,
        data: updatedCandidate,
        message: 'Candidate updated successfully'
      });
    } catch (error) {
      console.error('Update candidate error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update candidate'
      });
    }
  }
);

export default router;