import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import router from './routes';

dotenv.config();

const app = express();

// Middleware de seguridad
app.use(helmet());

// Middleware de CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Middleware de limite de peticiones
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 peticiones por IP
});
app.use(limiter);

app.use(morgan('combined'));

// Middleware de parseo de JSON
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({extended: true}));

// Middleware para servir archivos estáticos desde la carpeta uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

//Rutas basicas
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'Boutique Vicentinos API', 
    version: '1.0.0',
    status: 'running'
  });
});

// Ruta de salud
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString() 
  });
});

//monto las rutas de api
app.use('/api', router);

// Manejo de errores (debe ir ANTES de las rutas 404)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // Errores de Multer
  if (err.name === 'MulterError') {
    if (err.message === 'File too large') {
      return res.status(400).json({ 
        error: 'File too large', 
        message: 'El archivo excede el tamaño máximo permitido (5MB)' 
      });
    }
    return res.status(400).json({ 
      error: 'Upload error', 
      message: err.message 
    });
  }
  
  // Otros errores
  return res.status(500).json({ 
    error: 'Internal server error', 
    message: process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor'
  });
});

// Ruta 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 3000;
// Iniciar el servidor
app.listen(PORT, () => {
  // Servidor iniciado
});