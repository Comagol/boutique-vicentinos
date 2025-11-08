import admin from 'firebase-admin';
import serviceAccount from '../../firebase-service-account.json'

console.log(serviceAccount.project_id);

//inicializar firebase admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  storageBucket: `${serviceAccount.project_id}.appspot.com`
});

//obtengo las instancias
export const db = admin.firestore();
export const storage = admin.storage();
export const auth = admin.auth();
export {admin};