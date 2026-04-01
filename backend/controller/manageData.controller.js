import { pool } from "../connection.js";
import { uploadToS3 } from "../utils/s3.js";
import { configDotenv } from "dotenv";

configDotenv();
const isProduction = process.env.MODE === "production";

async function handleUpload(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const userId = req.user.id;
    
    let fileUrl;
    if (isProduction) {
      // In production, req.file.buffer is available because of multer.memoryStorage() in routes
      fileUrl = await uploadToS3(req.file, "documents");
    } else {
      fileUrl = `/uploads/${req.file.filename}`;
    }

    const originalFilename = req.file.originalname;
    const fileSize = req.file.size;
    const fileType = req.file.mimetype;
    const expiryDate = req.body.expiry_date || null;

    const result = await pool.query(
      "INSERT INTO documents (user_id, file_url, original_filename, file_size, file_type, expiry_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING uuid, file_url, original_filename, file_size, file_type, expiry_date, created_at",
      [userId, fileUrl, originalFilename, fileSize, fileType, expiryDate]
    );

    return res.status(201).json({
      message: "File uploaded successfully",
      document: result.rows[0],
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function handleGetDocuments(req, res) {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      "SELECT uuid, file_url, original_filename, expiry_date, created_at FROM documents WHERE user_id = $1 AND is_archived = false ORDER BY created_at DESC",
      [userId]
    );
    return res.json({ documents: result.rows });
  } catch (error) {
    console.error("Get documents error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function handleDeleteDocument(req, res) {
  try {
    const userId = req.user.id;
    const docUuid = req.params.uuid;

    const result = await pool.query(
      "UPDATE documents SET is_archived = true WHERE uuid = $1 AND user_id = $2 AND is_archived = false RETURNING uuid",
      [docUuid, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Document not found" });
    }

    return res.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Delete document error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export { handleUpload, handleGetDocuments, handleDeleteDocument };
