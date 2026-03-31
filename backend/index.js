import express from "express";
import cors from "cors";
import { pool } from "./connection.js";
import { configDotenv } from "dotenv";
import userRoutes from "./routes/user.routes.js";
configDotenv();

const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 3000;

//routes 
app.use('/user', userRoutes)
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
