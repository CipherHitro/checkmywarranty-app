import express from "express";
import { pool } from "./connection.js";
import { configDotenv } from "dotenv";
configDotenv();

const app = express();
const PORT = process.env.PORT || 3000;


app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/healthDB", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "DB connected" });
  } catch (err) {
    res.status(500).json({ status: "DB connection failed" });
  }
});
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
