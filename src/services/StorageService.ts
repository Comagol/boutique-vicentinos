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
    } catch (error) {
      
    }
  }
}
