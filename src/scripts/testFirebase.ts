import dotenv from 'dotenv';
import { db } from '../config/firebase';

dotenv.config();

async function testFirestore() {
  try {
    const collections = await db.listCollections();
    console.log('✅ Conexión OK. Colecciones existentes:', collections.map(col => col.id));
  } catch (error) {
    console.error('❌ Error al listar colecciones:', error);
  } finally {
    process.exit(0);
  }
}

testFirestore();