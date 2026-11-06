import { createApp } from './app.js';
import { firebaseDatabase } from './firebase.js';
import { createFirestoreStore } from './firestore-store.js';
import { createQuestionRepository } from './question-repository.js';

export async function createRuntime(env = process.env) {
  if (env.QUIZ_STORAGE && env.QUIZ_STORAGE !== 'firestore') throw new Error('Firestore is the only supported database');
  const db = firebaseDatabase(env);
  const store = createFirestoreStore(db);
  const loadQuestions = createQuestionRepository(db).load;
  const app = createApp({
    store, loadQuestions, serverless: !!env.VERCEL,
    secureCookies: env.COOKIE_SECURE === 'true' || (env.NODE_ENV === 'production' || !!env.VERCEL) && env.COOKIE_SECURE !== 'false',
  });
  return { app, store };
}
