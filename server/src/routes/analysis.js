import express from 'express';
import multer from 'multer';
import path from 'path';
import { checkAtsReadiness, createAnalysis, deleteAnalysis, getAnalyses, getAnalysisById } from '../controllers/analysisController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve(process.cwd(), '../uploads'));
  },
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
      return;
    }
    cb(new Error('Only PDF files are allowed.'));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post('/analyze', protect, upload.single('resume'), createAnalysis);
router.post('/ats-check', protect, upload.single('resume'), checkAtsReadiness);
router.get('/analyses', protect, getAnalyses);
router.get('/analyses/:id', protect, getAnalysisById);
router.delete('/analyses/:id', protect, deleteAnalysis);

export default router;
