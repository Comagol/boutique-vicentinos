import admin from 'firebase-admin';
import serviceAccount from '../../firebase-service-account.json';

// Verificar que Firebase Admin no esté ya inicializado
if (admin.apps.length === 0) {
  // Inicializar firebase admin
  // IMPORTANTE: Especificar projectId explícitamente
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    projectId: serviceAccount.project_id, // ✅ Agregado explícitamente
    storageBucket: 'boutique-vicentinos.firebasestorage.app' // ✅ Nombre correcto del bucket
  });
}
export const db = admin.firestore();
export const storage = admin.storage();
export const auth = admin.auth();

// Obtener el nombre del bucket desde la configuración
const app = admin.app();
export const STORAGE_BUCKET_NAME = app.options.storageBucket || 'boutique-vicentinos.firebasestorage.app';

export { admin };