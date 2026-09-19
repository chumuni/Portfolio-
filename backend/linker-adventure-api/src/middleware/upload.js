import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { config } from '../config/env.js';
import { badRequest } from '../utils/AppError.js';

fs.mkdirSync(config.uploads.dir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.uploads.dir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 10);
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: config.uploads.maxBytes, files: 4 },
  fileFilter: (_req, file, cb) => {
    if (config.uploads.allowedMimeTypes.includes(file.mimetype)) return cb(null, true);
    return cb(badRequest(`Unsupported file type: ${file.mimetype}`));
  },
});

/** Stored files are served from /uploads — keep path building in one place. */
export const publicUploadPath = (filename) => (filename ? `/uploads/${filename}` : null);
