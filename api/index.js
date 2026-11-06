import { createRuntime } from '../server/runtime.js';

let runtime;
export default async function handler(req, res) {
  try {
    runtime ??= createRuntime();
    const { app } = await runtime;
    return app(req, res);
  } catch {
    runtime = undefined;
    console.error('Firebase runtime unavailable: verify server credentials and Firestore configuration.');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({ error: 'Le service est momentanément indisponible.' });
  }
}
