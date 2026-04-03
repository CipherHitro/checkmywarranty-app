import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./connection.js";
import { configDotenv } from "dotenv";
import userRoutes from "./routes/user.routes.js";
import manageDataRoutes from "./routes/manageData.routes.js";
import './queues/reminderQueue.js';
configDotenv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
const PORT = process.env.PORT || 3000;

//routes 
app.use('/user', userRoutes)
app.use('/manageData', manageDataRoutes)
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


app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
