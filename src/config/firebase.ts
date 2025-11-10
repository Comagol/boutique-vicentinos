import admin from 'firebase-admin';
import serviceAccount from '../../firebase-service-account.json';

// Verificar que Firebase Admin no esté ya inicializado
if (admin.apps.length === 0) {
  // Inicializar firebase admin
  // IMPORTANTE: Especificar projectId explícitamente
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    projectId: serviceAccount.project_id, // ✅ Agregado explícitamente
    storageBucket: `${serviceAccount.project_id}.appspot.com`
  });
}
export const db = admin.firestore();
export const storage = admin.storage();
export const auth = admin.auth();
export { admin };