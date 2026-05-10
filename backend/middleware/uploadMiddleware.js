import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================
// Disk Storage — local uploads folder
// ============================================================
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// ============================================================
// Memory Storage — for Cloudinary pipeline
// ============================================================
const memoryStorage = multer.memoryStorage();

// ============================================================
// File Filter — images only
// ============================================================
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|avif/;
  const extOk = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowedTypes.test(file.mimetype);
  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpeg, png, gif, webp)"), false);
  }
};

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || "5242880"); // 5MB

// ============================================================
// Upload instances
// ============================================================

/** For local disk storage */
export const uploadLocal = multer({
  storage: diskStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: imageFilter,
});

/** For Cloudinary (memory) */
export const uploadMemory = multer({
  storage: memoryStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: imageFilter,
});

/** Single image upload fields */
export const uploadProfileImage = uploadMemory.single("profile_image");
export const uploadCoverImage = uploadMemory.single("cover_image");
export const uploadJournalImages = uploadMemory.array("images", 5);
export const uploadPostImage = uploadMemory.single("image");
