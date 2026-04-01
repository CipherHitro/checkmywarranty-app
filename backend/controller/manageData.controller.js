import { pool } from "../connection.js";

async function handleUpload(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const userId = req.user.id;
    const fileUrl = `/uploads/${req.file.filename}`;
    const originalFilename = req.file.originalname;
    const expiryDate = req.body.expiry_date || null;

    const result = await pool.query(
      "INSERT INTO documents (user_id, file_url, original_filename, expiry_date) VALUES ($1, $2, $3, $4) RETURNING *",
      [userId, fileUrl, originalFilename, expiryDate]
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
      "SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC",
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
    const docId = req.params.id;

    const result = await pool.query(
      "DELETE FROM documents WHERE id = $1 AND user_id = $2 RETURNING *",
      [docId, userId]
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
