import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export const defaultProjectId = 'php-pratique-qcm';

export function firebaseDatabase(env = process.env) {
  const projectId = env.FIREBASE_PROJECT_ID || defaultProjectId;
  if (env.VERCEL && env.FIRESTORE_EMULATOR_HOST) throw new Error('Emulator access is forbidden on Vercel');
  const name = `quiz-${projectId}`;
  let app = getApps().find((item) => item.name === name);
  if (!app) {
    let credential;
    if (env.FIRESTORE_EMULATOR_HOST) {
      if (!projectId.startsWith('demo-') || !/^(127\.0\.0\.1|localhost):\d+$/.test(env.FIRESTORE_EMULATOR_HOST)) throw new Error('Use a local emulator and a demo project');
      credential = applicationDefault();
    } else if (env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      let account;
      try { account = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON); }
      catch { throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON must contain valid JSON'); }
      if (account.project_id !== projectId) throw new Error('Firebase credential project does not match FIREBASE_PROJECT_ID');
      credential = cert(account);
    } else {
      if (!env.GOOGLE_APPLICATION_CREDENTIALS) throw new Error('Configure FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS on the server');
      credential = applicationDefault();
    }
    app = initializeApp({ projectId, credential }, name);
  }
  return getFirestore(app);
}
