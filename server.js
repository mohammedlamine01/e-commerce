import express from "express";
import path from "path";
import cors from "cors";
import multer from "multer";
import { db, bucket } from "./firebase.js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

function buildSafeFileName(originalName) {
  const ext = path.extname(originalName) || ".jpg";
  const baseName = path
    .basename(originalName, ext)
    .replace(/[^a-zA-Z0-9_-]/g, "-");
  return `uploads/${Date.now()}-${baseName}${ext}`;
}

async function uploadToStorage(buffer, mimetype, remoteFileName) {
  if (!bucket) throw new Error("Firebase Storage bucket is not initialized.");
  const file = bucket.file(remoteFileName);
  
  await file.save(buffer, {
    metadata: { contentType: mimetype },
  });
  
  // Make the file publicly accessible
  await file.makePublic();
  
  return `https://storage.googleapis.com/${bucket.name}/${remoteFileName}`;
}

async function deleteFromStorage(remoteFileName) {
  if (!bucket) throw new Error("Firebase Storage bucket is not initialized.");
  const file = bucket.file(remoteFileName);
  await file.delete();
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed."));
    }
    cb(null, true);
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/upload-test", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "upload-test.html"));
});

app.get("/upload-test.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "upload-test.html"));
});

app.get("/add-product", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "add-product.html"));
});

// Test route
app.get("/", (req, res) => {
  res.send('Hello from Express server. Open <a href="/upload-test.html">/upload-test.html</a> to test image upload.');
});

app.delete("/delete-image", async (req, res, next) => {
  const { filename } = req.body;
  
  if (!filename) {
    return res.status(400).json({ error: "Filename is required" });
  }

  try {
    await deleteFromStorage(filename);
    res.json({ message: "Image deleted from Firebase Storage successfully." });
  } catch (error) {
    next(error);
  }
});

app.post("/upload-image", upload.single("image"), async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image file uploaded." });
  }

  try {
    const filename = buildSafeFileName(req.file.originalname || "image.jpg");
    const imageUrl = await uploadToStorage(req.file.buffer, req.file.mimetype, filename);

    res.json({
      message: "Image uploaded successfully.",
      filename,
      imageUrl,
    });
  } catch (error) {
    next(error);
  }
});

app.post("/add-product", upload.single("image"), async (req, res, next) => {
  const { name, price } = req.body;

  if (!name || !price || !req.file) {
    return res
      .status(400)
      .json({ error: "Missing name, price, or image file." });
  }

  try {
    const filename = buildSafeFileName(req.file.originalname);
    const imageUrl = await uploadToStorage(req.file.buffer, req.file.mimetype, filename);

    const productData = {
      name,
      price: parseFloat(price),
      imageUrl,
      createdAt: new Date(),
    };

    const docRef = await db.collection("products").add(productData);

    res.status(201).json({
      message: "Product added successfully!",
      productId: docRef.id,
      data: productData,
    });
  } catch (error) {
    next(error);
  }
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }

  if (err) {
    console.error("Server Error:", err);
    return res.status(500).json({ error: err.message || "Upload failed." });
  }

  next();
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});