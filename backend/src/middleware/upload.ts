import multer from "multer";
import path from "path";
import { Request } from "express";
import fs from "fs";
import AppError from "../errors/AppError";

// Tipos de arquivos permitidos
const ALLOWED_TYPES = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg', 
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'text/plain': '.txt',
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
  'audio/ogg': '.ogg',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'application/zip': '.zip',
  'application/x-rar-compressed': '.rar'
};

// Configuração de storage
const storage = multer.diskStorage({
  destination: (req: Request, file, cb) => {
    const { companyId } = req.user;
    const uploadDir = path.join(process.cwd(), "public", "chat", companyId.toString());
    
    // Criar diretório se não existir
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req: Request, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = ALLOWED_TYPES[file.mimetype] || path.extname(file.originalname);
    cb(null, `chat-${uniqueSuffix}${extension}`);
  }
});

// Filtros de arquivo
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_TYPES[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}`));
  }
};

// Configuração do multer
export const uploadChatFile = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 5 // Máximo 5 arquivos por vez
  }
});

// Middleware para processar upload
export const processChatUpload = uploadChatFile.fields([
  { name: 'files', maxCount: 5 },
  { name: 'audio', maxCount: 1 },
  { name: 'image', maxCount: 5 }
]);

// Função para obter informações do arquivo
export const getFileInfo = (file: Express.Multer.File, companyId: string) => {
  const relativePath = path.join("chat", companyId, file.filename);
  const fileType = getFileType(file.mimetype);
  const fileSize = formatFileSize(file.size);

  return {
    mediaPath: relativePath,
    mediaName: file.originalname,
    fileType,
    fileSize,
    mimeType: file.mimetype
  };
};

// Determinar tipo de arquivo para exibição
const getFileType = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'spreadsheet';
  return 'file';
};

// Formatar tamanho do arquivo
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default { processChatUpload, getFileInfo };