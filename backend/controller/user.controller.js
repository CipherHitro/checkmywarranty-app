import { pool } from "../connection.js";
import bcrypt from "bcryptjs";
import { setUser } from "../services/auth.services.js";

export async function handleUserSignUp(req, res) {
  const { fullname, email, password } = req.body;
  console.log(req.body);

  if (!fullname || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: "User with this email already exists" });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    const newUser = await pool.query(
      "INSERT INTO users (fullname, email, password_hash) VALUES ($1, $2, $3) RETURNING id, email",
      [fullname, email, password_hash]
    );

    return res.status(201).json({
      message: "User registered successfully",
      user: { id: newUser.rows[0].id, email: newUser.rows[0].email },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function handleUserLogIn(req, res) {
  const { email, password } = req.body;
  console.log(req.body);

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = result.rows[0];

    const isMatch = bcrypt.compareSync(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = setUser(user);

    return res.json({
      token,
      user: { id: user.id, name: user.fullname, email: user.email },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
