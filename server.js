const express = require("express");
const path = require("path");
const { Readable } = require("stream");
const cors = require("cors");
const multer = require("multer");
const ftp = require("basic-ftp");

require("dotenv").config();

const app = express();

const PORT = 3000;

const ftpConfig = {
  host: process.env.FTP_HOST || "ftpupload.net",
  port: Number(process.env.FTP_PORT || 21),
  user: process.env.FTP_USER || "if0_41673431",
  password: process.env.FTP_PASSWORD || "BGJ0CzDFK08KH",
  remoteDir: process.env.FTP_REMOTE_DIR || "/htdocs/uploads",
  publicBaseUrl: process.env.FTP_PUBLIC_BASE_URL || "",
};

function buildSafeFileName(originalName) {
  const ext = path.extname(originalName) || ".jpg";
  const baseName = path
    .basename(originalName, ext)
    .replace(/[^a-zA-Z0-9_-]/g, "-");
  return `${Date.now()}-${baseName}${ext}`;
}

async function uploadToFtp(buffer, remoteFileName) {
  const client = new ftp.Client(15000);

  try {
    await client.access({
      host: ftpConfig.host,
      port: ftpConfig.port,
      user: ftpConfig.user,
      password: ftpConfig.password,
      secure: false,
    });

    await client.ensureDir(ftpConfig.remoteDir);
    await client.uploadFrom(Readable.from(buffer), remoteFileName);
  } finally {
    client.close();
  }
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

// Test route
app.get("/", (req, res) => {
  res.send('Hello from Express server. Open <a href="/upload-test.html">/upload-test.html</a> to test FTP image upload.');
});

app.post("/upload-image", upload.single("image"), async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image file uploaded." });
  }

  try {
    const filename = buildSafeFileName(req.file.originalname || "image.jpg");
    await uploadToFtp(req.file.buffer, filename);

    const baseUrl = ftpConfig.publicBaseUrl.replace(/\/$/, "");
    const imageUrl = baseUrl ? `${baseUrl}/${filename}` : null;

    res.json({
      message: "Image uploaded to FTP successfully.",
      filename,
      remotePath: `${ftpConfig.remoteDir}/${filename}`,
      imageUrl,
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
    return res.status(400).json({ error: err.message || "Upload failed." });
  }

  next();
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});