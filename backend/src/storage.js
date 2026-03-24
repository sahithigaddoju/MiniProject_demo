/**
 * Mock cloud storage (simulates AWS S3).
 * Files are stored locally under /uploads and served statically.
 */
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = 'uploads';

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

export function saveFile(filename, content) {
  const filePath = path.join(UPLOAD_DIR, filename);
  fs.writeFileSync(filePath, content);
  return `/uploads/${filename}`;
}

export function getFileUrl(filename) {
  return `http://localhost:5000/uploads/${filename}`;
}
