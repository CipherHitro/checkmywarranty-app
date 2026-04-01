import express from "express";
import multer from "multer";
import { authMiddleware } from "../middlewares/auth.middlewares.js";
import { handleUpload, handleGetDocuments, handleDeleteDocument } from "../controller/manageData.controller.js";
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
      cb(null, `${Date.now()}-${file.originalname}`);
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

router.post("/upload", authMiddleware, upload.single("file"), handleUpload);
router.get("/documents", authMiddleware, handleGetDocuments);
router.delete("/documents/:uuid", authMiddleware, handleDeleteDocument);

export default router;