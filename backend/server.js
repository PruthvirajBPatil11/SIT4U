// @ts-nocheck

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const User = require("./models/User");

const app = express();
const PORT = process.env.PORT || 5000;

// Allow only your frontend dev URL (more secure)
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Make uploads folder static so uploaded files are accessible
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---------- MongoDB connection ----------
const MONGO_URL = "mongodb+srv://AL207_db_user:6zqTgpJnWoEu8NLY@cluster1.rws35gx.mongodb.net/sit4u?retryWrites=true&w=majority&appName=Cluster1";

 // <<-- REPLACE THIS
mongoose
  .connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message || err);
    process.exit(1);
  });

// ---------- Multer setup for file uploads ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "uploads")),
  filename: (req, file, cb) => {
    // keep original extension, make filename unique
    const ext = path.extname(file.originalname);
    const name = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // accept images only
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

// ---------- Routes ----------

// Health
app.get("/", (req, res) => res.json({ status: "ok" }));

// Save user with file upload
app.post("/register", upload.single("idCard"), async (req, res) => {
  try {
    const { name, usn, email, section } = req.body;

    if (!name || !usn || !email) {
      return res.status(400).json({ message: "name, usn and email are required" });
    }

    let idCardUrl = "";
    if (req.file && req.file.filename) {
      // build a URL accessible from the browser
      idCardUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    }

    const user = new User({
      name,
      usn,
      email,
      section,
      idCard: idCardUrl,
    });

    await user.save();
    res.status(201).json({ message: "User saved", user });
  } catch (err) {
    console.error("Error in /register:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// Get all users (so you can use this anywhere in frontend)
app.get("/users", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
});
// Get single user by id
app.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// Save / update interests for a user
app.post("/users/:id/interests", async (req, res) => {
  try {
    const update = { interests: req.body }; // expects the entire interests object
    const user = await User.findByIdAndUpdate(req.params.id, { $set: { interests: update.interests } }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Interests updated", user });
  } catch (err) {
    console.error("Error updating interests:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});


// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
