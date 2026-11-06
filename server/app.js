import express from 'express';
import helmet from 'helmet';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { isIP } from 'node:net';
import { parseCookie } from 'cookie';
import { randomBytes } from 'node:crypto';
import { levels } from './levels.js';
import { createAttempt, answerAttempt, nextQuestion, publicAttempt } from './engine.js';

export function createApp({ store, loadQuestions, secureCookies = false, now = Date.now, limits = true, serverless = false } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet({ strictTransportSecurity: false, contentSecurityPolicy: { directives: { 'script-src': ["'self'"], 'style-src': ["'self'"], 'upgrade-insecure-requests': null } } }));
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  function clientIdentity(req) {
    // Vercel overwrites this header. Self-hosted servers ignore it entirely.
    const forwarded = serverless ? req.get('X-Forwarded-For')?.split(',').at(-1)?.trim() : null;
    return ipKeyGenerator(forwarded && isIP(forwarded) ? forwarded : req.ip);
  }
  if (limits) app.use('/api', rateLimit({ windowMs: 60_000, limit: 150, keyGenerator: clientIdentity, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Trop de requêtes. Réessayez dans une minute.' } }));
  function limiter(bucket, limit, windowMs, message) {
    if (!store.consumeRate) return rateLimit({ windowMs, limit, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: message } });
    return async (req, res, next) => {
      const result = await store.consumeRate(clientIdentity(req), bucket, limit, windowMs);
      if (!result.allowed) return res.set('Retry-After', String(result.retryAfter)).status(429).json({ error: message });
      next();
    };
  }
  app.use('/api', (req, res, next) => {
    // A custom header + same-origin policy prevents form-based CSRF. No CORS is enabled.
    if (req.method !== 'GET' && (req.get('X-Quiz-Client') !== 'php-pratique' || !req.is('application/json') || req.get('Sec-Fetch-Site') === 'cross-site')) return res.status(403).json({ error: 'Requête non autorisée.' });
    if (req.method !== 'GET' && req.get('Origin')) {
      let origin;
      try { origin = new URL(req.get('Origin')); } catch { return res.status(403).json({ error: 'Origine non autorisée.' }); }
      if (origin.host !== req.get('host')) return res.status(403).json({ error: 'Origine non autorisée.' });
    }
    next();
  });
  app.use(express.json({ limit: '2kb' }));
  if (limits && store.consumeRate) app.use('/api', limiter('api', 150, 60_000, 'Trop de requêtes. Réessayez dans une minute.'));
  function token(req) {
    const value = parseCookie(req.headers.cookie || '').php_attempt;
    return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value) ? value : null;
  }
  function session(req, res, next) {
    req.attemptToken = token(req);
    if (!req.attemptToken) return res.status(401).json({ error: 'Cette tentative a expiré. Choisissez un niveau pour recommencer.' });
    next();
  }
  async function update(req, res, mutate, error) {
    const result = await store.update(req.attemptToken, mutate);
    if (result.missing) return res.status(401).json({ error: 'Cette tentative a expiré. Choisissez un niveau pour recommencer.' });
    if (result.invalid) return res.status(409).json({ error });
    res.json(publicAttempt(result.attempt, now()));
  }
  app.get('/api/levels', (req, res) => res.json({ levels, questionCount: 10 }));
  app.get('/api/attempt', async (req, res) => {
    const id = token(req);
    const attempt = id ? await store.get(id) : null;
    res.json(attempt ? publicAttempt(attempt, now()) : { phase: 'home' });
  });
  const startLimit = limiter('start', 12, 15 * 60_000, 'Plusieurs essais ont été lancés. Revenez dans quelques minutes.');
  app.post('/api/attempt', ...(limits ? [startLimit] : []), async (req, res) => {
    const levelId = req.body?.level;
    if (!levels.some((level) => level.id === levelId)) return res.status(400).json({ error: 'Choisissez un niveau valide.' });
    const oldToken = token(req);
    // Repeated start requests resume the current attempt rather than resetting its timer.
    const existing = oldToken ? await store.get(oldToken) : null;
    if (existing && !existing.complete) return res.json(publicAttempt(existing, now()));
    await store.clean();
    if (store.count && await store.count() >= 10_000) return res.status(503).json({ error: 'Le service est occupé. Réessayez un peu plus tard.' });
    const source = await loadQuestions(levelId);
    const id = randomBytes(32).toString('hex');
    const { attempt, resumed } = await store.start(oldToken, id, () => createAttempt(levelId, now(), source));
    if (resumed) return res.json(publicAttempt(attempt, now()));
    res.cookie('php_attempt', id, { httpOnly: true, sameSite: 'strict', secure: secureCookies, path: '/api', maxAge: 2 * 60 * 60 * 1000 });
    res.status(201).json(publicAttempt(attempt, now()));
  });
  app.post('/api/answer', session, async (req, res) => {
    const { questionId, optionId } = req.body ?? {};
    if (typeof questionId !== 'string' || !(optionId === null || typeof optionId === 'string')) return res.status(409).json({ error: 'Réponse invalide.' });
    await update(req, res, (attempt) => answerAttempt(attempt, questionId, optionId, now()), 'Réponse invalide ou question déjà passée. Rechargez la tentative.');
  });
  app.post('/api/next', session, async (req, res) => {
    if (typeof req.body?.questionId !== 'string') return res.status(409).json({ error: 'Question invalide.' });
    await update(req, res, (attempt) => nextQuestion(attempt, req.body.questionId, now()), 'Validez la question avant de continuer.');
  });
  app.post('/api/reset', session, async (req, res) => {
    await store.delete(req.attemptToken);
    res.clearCookie('php_attempt', { path: '/api', httpOnly: true, sameSite: 'strict', secure: secureCookies });
    res.json({ phase: 'home' });
  });
  app.use('/api', (req, res) => res.status(404).json({ error: 'Cette route n\'existe pas.' }));
  app.use((req, res) => res.status(404).send('Page introuvable.'));
  app.use((error, req, res, _next) => {
    const status = error.status === 413 ? 413 : error instanceof SyntaxError ? 400 : 500;
    if (status === 500) console.error('API failure:', error.code || 'internal');
    res.status(status).json({ error: status === 500 ? 'Le service est momentanément indisponible.' : 'Le format de la requête est invalide.' });
  });
  return app;
}
