import dotenv from 'dotenv';
import admin from 'firebase-admin';
import serviceAccount from '../../firebase-service-account.json';

dotenv.config();

async function diagnoseFirebase() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DE FIREBASE\n');
  console.log('='.repeat(50));
  
  // 1. Verificar credenciales
  console.log('\n1️⃣ Verificando credenciales...');
  console.log('   Project ID:', serviceAccount.project_id);
  console.log('   Client Email:', serviceAccount.client_email);
  console.log('   ✅ Credenciales cargadas correctamente');
  
  // 2. Inicializar Firebase Admin
  console.log('\n2️⃣ Inicializando Firebase Admin...');
  if (admin.apps.length === 0) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        projectId: serviceAccount.project_id, // ✅ CRÍTICO: Especificar projectId explícitamente
        storageBucket: `${serviceAccount.project_id}.appspot.com`
      });
      console.log('   ✅ Firebase Admin inicializado con projectId:', serviceAccount.project_id);
    } catch (error: any) {
      console.error('   ❌ Error al inicializar:', error.message);
      process.exit(1);
    }
  } else {
    console.log('   ⚠️ Ya estaba inicializado');
  }
  
  // 3. Intentar diferentes formas de acceder a Firestore
  console.log('\n3️⃣ Probando acceso a Firestore...');
  
  // Método 1: Sin especificar databaseId (usa default)
  console.log('\n   📝 Método 1: Firestore sin databaseId explícito');
  try {
    const db1 = admin.firestore();
    const collections1 = await db1.listCollections();
    console.log('   ✅ ÉXITO - Colecciones encontradas:', collections1.map(c => c.id));
  } catch (error: any) {
    console.error('   ❌ Error:', error.code, error.message);
    if (error.details) {
      console.error('   Detalles:', error.details);
    }
  }
  
  // Método 2: Intentar crear un documento directamente (a veces funciona aunque listCollections falle)
  console.log('\n   📝 Método 2: Crear documento de prueba directamente');
  try {
    const db2 = admin.firestore();
    const testRef = db2.collection('_diagnostic_test').doc('test');
    await testRef.set({
      test: true,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('   ✅ ÉXITO - Documento creado');
    
    // Leer el documento
    const doc = await testRef.get();
    console.log('   ✅ Documento leído:', doc.exists);
    
    // Eliminar el documento
    await testRef.delete();
    console.log('   ✅ Documento eliminado');
  } catch (error: any) {
    console.error('   ❌ Error:', error.code, error.message);
    if (error.details) {
      console.error('   Detalles:', error.details);
    }
    if (error.metadata) {
      console.error('   Metadata:', JSON.stringify(error.metadata, null, 2));
    }
  }
  
  // Método 3: Verificar configuración del proyecto
  console.log('\n4️⃣ Verificando información del proyecto...');
  try {
    const app = admin.app();
    console.log('   Project ID desde app:', app.options.projectId);
    console.log('   Storage Bucket:', app.options.storageBucket);
  } catch (error: any) {
    console.error('   ❌ Error:', error.message);
  }
  
  // Método 4: Intentar con settings explícitos
  console.log('\n5️⃣ Probando con settings explícitos...');
  try {
    const db3 = admin.firestore();
    // Configurar settings si es necesario
    db3.settings({ 
      ignoreUndefinedProperties: true 
    });
    
    // Intentar una operación simple
    const batch = db3.batch();
    const testRef2 = db3.collection('_test').doc('batch-test');
    batch.set(testRef2, { test: 'batch' });
    await batch.commit();
    console.log('   ✅ ÉXITO - Batch operation completada');
    
    // Limpiar
    await testRef2.delete();
  } catch (error: any) {
    console.error('   ❌ Error:', error.code, error.message);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('\n💡 RECOMENDACIONES:');
  console.log('1. Verifica en Firebase Console que la base de datos "(default)" esté creada');
  console.log('2. Verifica que el modo sea "Firestore Native" (no Datastore)');
  console.log('3. Espera 2-3 minutos después de crear la base de datos');
  console.log('4. Verifica que el plan de facturación esté activo y vinculado');
  console.log('5. Verifica permisos de la cuenta de servicio en Google Cloud Console');
  console.log('6. Intenta eliminar y recrear la base de datos desde Firebase Console');
  
  process.exit(0);
}

diagnoseFirebase().catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});

