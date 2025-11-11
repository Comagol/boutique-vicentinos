import { storage } from '../config/firebase';
import path from 'path';
import fs from 'fs';

//configuro el bucket de firebase Storage
const BUCKET_NAME = 'products'; //dentro de esta carpeta se guardan las imagenes de los productos

//servicio para manejar la subida de archivos a firebase Storage
export const StorageService = {
 /**
   * Sube un archivo a Firebase Storage y retorna su URL pública
   * @param filePath - Ruta local del archivo temporal
   * @param fileName - Nombre del archivo (se usará en Storage)
   * @returns URL pública del archivo en Firebase Storage
   */
  async uploadFile(filePath: string, fileName: string): Promise<string> {
    try {
      const bucket = storage.bucket();

      const storaPath = `${BUCKET_NAME}/${fileName}`;
      const file = bucket.file(storagePath);

      await bucket.upload(filePath,{
        destination: storagePath,
        metadata: {
          contentType: this.getContentType(fileName),
          cacheControl: 'public, max-age=31536000',
        },
      });

      await file.makePublic();

      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
      return publicUrl;
    } catch (error: any) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  },

  /**
   * Sube múltiples archivos y retorna sus URLs
   * @param files - Array de archivos de Multer
   * @returns Array de URLs públicas
   */

  async uploadMultipleFiles(files: Express.Multer.File[]): Promise<string[]> {
const uploadPromises = files.map(file => {
  const filePath = file.path;
  const fileName = file.filename;

  return this.uploadFile(filePath, fileName);
  });
  const urls = await Promise.all(uploadPromises);
  return urls;
  },

  /** 
   * Elimina un archivo temporal de Firebase Storage
   * @param filePath - Ruta local del archivo temporal
   */
  async deleteLocalFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error(`Error deleting local file: ${filePath}`, error);
    }
  },

  /** 
   * Elimina multilpes archivos temporales
  */

  async deleteLocalFiles(files: Express.Multer.File[]): Promise<void> {
    const deletePromises = files.map(file => this.deleteLocalFile(file.path));
    await Promise.all(deletePromises);
  },

  /**
   * Determina el content type basado en la extensión del archivo
   * @param fileName - Nombre del archivo
   * @returns Content type MIME
   */
  getContentType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    const contentTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
    return contentTypes[ext] || 'image/jpeg';
  },
  
  /**
   * Elimina un archivo de Firebase Storage
   * @param fileUrl - URL pública del archivo en Storage
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const bucket = storage.bucket();
      
      // Extraer el path del archivo desde la URL
      // Ejemplo: https://storage.googleapis.com/bucket-name/products/file.jpg
      // -> products/file.jpg
      const urlParts = fileUrl.split('/');
      const filePath = urlParts.slice(-2).join('/'); // products/file.jpg
      
      const file = bucket.file(filePath);
      await file.delete();
    } catch (error) {
      throw new Error(`Error deleting file from Firebase Storage: ${error}`);
    }
  },
}
