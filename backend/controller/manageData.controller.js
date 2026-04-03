import { pool } from "../connection.js";
import { uploadToS3, generateSignedUrl, getFileFromS3 } from "../utils/s3.js";
import { encryptBuffer, decryptBuffer } from "../utils/encryption.js";
import { configDotenv } from "dotenv";
import fs from "fs";
import path from "path";

configDotenv();
const isProduction = process.env.MODE === "production";

async function handleUpload(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const userId = req.user.id;
    const originalFilename = decodeURIComponent(req.file.originalname).replace(/\s+/g, '_');
    const fileSize = req.file.size;
    const fileType = req.file.mimetype;
    const expiryDate = req.body.expiry_date || null;
    
    let fileUrl = null;   // used in dev only
    let s3Key = null;     // used in prod only
    let iv = null;        // encryption iv, prod only

    if (isProduction) {
      // Encrypt buffer before uploading
      const { encrypted, iv: generatedIv } = encryptBuffer(req.file.buffer);
      iv = generatedIv;

      // Upload encrypted bytes, get back s3Key
      s3Key = await uploadToS3(
        encrypted,
        req.file.mimetype,
        req.file.originalname
      );
    } else {
      // Dev — file already saved to disk by multer diskStorage
      fileUrl = `/uploads/${req.file.filename}`;
    }

    const result = await pool.query(
      `INSERT INTO documents 
        (user_id, file_url, s3_key, original_filename, file_size, file_type, 
         is_encrypted, encryption_iv, expiry_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING uuid, original_filename, file_size, file_type, expiry_date, created_at`,
      [userId, fileUrl, s3Key, originalFilename, fileSize, fileType, isProduction, iv, expiryDate]
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
      `SELECT uuid, original_filename, file_type, file_size, expiry_date, created_at 
       FROM documents 
       WHERE user_id = $1 AND is_archived = false 
       ORDER BY created_at DESC`,
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

async function handleGetDocumentUrl(req, res) {
  try {
    const userId = req.user.id;
    const docUuid = req.params.uuid;

    const result = await pool.query(
      `SELECT file_url, s3_key, file_type, original_filename, is_encrypted, encryption_iv
       FROM documents 
       WHERE uuid = $1 AND user_id = $2 AND is_archived = false`,
      [docUuid, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Document not found" });
    }
    if (!isProduction) {
      // Dev — file is on disk, return the local URL as before
      const filePath = path.join(process.cwd(), result.rows[0].file_url);
      const localBuffer = fs.readFileSync(filePath);
      res.set({
        'Content-Type': result.rows[0].file_type,
        'Content-Length': localBuffer.length,
        'Content-Disposition': `inline; filename="${result.rows[0].original_filename}"`,
      });
      return res.send(localBuffer);
    }
    // Production — fetch from S3, decrypt, stream bytes directly
    const row = result.rows[0];
    const encryptedBuffer = await getFileFromS3(row.s3_key);
    
    let fileBuffer;
    if (row.is_encrypted && row.encryption_iv) {
      fileBuffer = decryptBuffer(encryptedBuffer, row.encryption_iv);
    } else {
      // Files uploaded before encryption was added
      fileBuffer = encryptedBuffer;
    }
    res.set({
      'Content-Type': row.file_type,
      'Content-Length': fileBuffer.length,
      'Content-Disposition': `inline; filename="${row.original_filename}"`,
    });
    return res.send(fileBuffer);

  } catch (error) {
    console.error("Get document URL error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export { handleUpload, handleGetDocuments, handleDeleteDocument, handleGetDocumentUrl };
