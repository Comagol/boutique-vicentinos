import multer from 'multer';
import path from 'path';
import fs from 'fs';

//me aseguro de que la carpeta uploads exista
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}