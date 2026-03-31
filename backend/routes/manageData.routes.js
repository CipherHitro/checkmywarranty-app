import express from "express";
import { authMiddleware } from "../middlewares/auth.middlewares.js";
import { upload, handleUpload, handleGetDocuments, handleDeleteDocument } from "../controller/manageData.controller.js";

const router = express.Router();

router.post("/upload", authMiddleware, upload.single("file"), handleUpload);
router.get("/documents", authMiddleware, handleGetDocuments);
router.delete("/documents/:id", authMiddleware, handleDeleteDocument);

export default router;