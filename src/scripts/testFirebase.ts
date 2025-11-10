import dotenv from 'dotenv';
import { db } from '../config/firebase';

dotenv.config();

async function testFirestore() {
  try {
    console.log('🔍 Intentando listar colecciones...');
    
    // Intentar listar colecciones (esto requiere que la base de datos exista)
    const collections = await db.listCollections();
    console.log('✅ Conexión OK. Colecciones existentes:', collections.map(col => col.id));
    
    // Intentar crear un documento de prueba en una colección temporal
    console.log('\n🔍 Intentando escribir en Firestore...');
    const testRef = db.collection('_test_connection').doc('test');
    await testRef.set({
      timestamp: new Date(),
      message: 'Test de conexión'
    });
    console.log('✅ Escritura OK');
    
    // Limpiar el documento de prueba
    await testRef.delete();
    console.log('✅ Limpieza OK');
    
  } catch (error: any) {
    console.error('\n❌ Error al conectar con Firestore:');
    console.error('Tipo de error:', error.code || 'Desconocido');
    console.error('Mensaje:', error.message);
    console.error('Detalles completos:', JSON.stringify(error, null, 2));
    
    // Errores comunes y sus soluciones
    if (error.code === 5 || error.message?.includes('NOT_FOUND')) {
      console.error('\n💡 Posibles soluciones:');
      console.error('1. Verifica que la base de datos "(default)" exista en Firebase Console');
      console.error('2. Verifica que el proyecto tenga un plan de facturación activo');
      console.error('3. Verifica que Cloud Firestore API esté habilitada');
      console.error('4. Si creaste una base con otro nombre, especifica el databaseId en firebase.ts');
    }
    
    if (error.code === 7 || error.message?.includes('PERMISSION_DENIED')) {
      console.error('\n💡 Error de permisos:');
      console.error('1. Verifica que la cuenta de servicio tenga rol "Cloud Datastore User"');
      console.error('2. Verifica que el archivo firebase-service-account.json sea válido');
    }
  } finally {
    process.exit(0);
  }
}

testFirestore();