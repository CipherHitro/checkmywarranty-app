import express from "express";
import multer from "multer";
import { authMiddleware } from "../middlewares/auth.middlewares.js";
import { handleUpload, handleGetDocuments, handleDeleteDocument, handleGetDocumentUrl } from "../controller/manageData.controller.js";
import { configDotenv } from "dotenv";
configDotenv()
const isProduction = process.env.MODE === 'production';

let storage;
// Multer storage config
if(isProduction){
  storage = multer.memoryStorage();
}
else {
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
      // The filename might be URL-encoded, so we decode it first
      const decodedName = decodeURIComponent(file.originalname);
      // Replace spaces (and other whitespace) with underscores
      const sanitizedFileURL = decodedName.replace(/\\s+/g, '_');
      console.log(file.originalname)
      console.log("Sanitized :", sanitizedFileURL)

      cb(null, `${Date.now()}-${sanitizedFileURL}`);
    },
  });
}

// File filter — allow images and PDFs
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "application/octet-stream"
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, WebP images and PDF files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

const router = express.Router();

router.post("/upload", authMiddleware, (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err.message); // this will tell you exactly what failed
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, handleUpload);
// router.post("/upload", authMiddleware, upload.single("file"), handleUpload);
router.get("/documents", authMiddleware, handleGetDocuments);
router.get("/documents/:uuid/url", authMiddleware, handleGetDocumentUrl);
router.delete("/documents/:uuid", authMiddleware, handleDeleteDocument);

export default router;