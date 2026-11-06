import { createHash } from 'node:crypto';

const duration = 2 * 60 * 60 * 1000;
const key = (token) => createHash('sha256').update(token).digest('hex');
const active = (data, now) => data && data.expiresAt.toMillis() > now ? data.attempt : null;

export function createFirestoreStore(db, { clock = Date.now, prefix = 'quiz_' } = {}) {
  const attempts = db.collection(`${prefix}attempts`);
  const rates = db.collection(`${prefix}rate_limits`);
  return {
    kind: 'firestore',
    async get(token) {
      const snapshot = await attempts.doc(key(token)).get();
      return active(snapshot.data(), clock());
    },
    async start(oldToken, newToken, create) {
      return db.runTransaction(async (transaction) => {
        const previous = oldToken ? attempts.doc(key(oldToken)) : null;
        const existing = previous ? active((await transaction.get(previous)).data(), clock()) : null;
        if (existing && !existing.complete) return { attempt: existing, resumed: true };
        const attempt = create();
        if (previous) transaction.delete(previous);
        transaction.create(attempts.doc(key(newToken)), { attempt, expiresAt: new Date(clock() + duration) });
        return { attempt, resumed: false };
      });
    },
    async update(token, mutate) {
      const ref = attempts.doc(key(token));
      return db.runTransaction(async (transaction) => {
        const attempt = active((await transaction.get(ref)).data(), clock());
        if (!attempt) return { missing: true };
        if (!mutate(attempt)) return { invalid: true };
        transaction.set(ref, { attempt, expiresAt: new Date(clock() + duration) });
        return { attempt };
      });
    },
    async delete(token) { await attempts.doc(key(token)).delete(); },
    async consumeRate(identity, bucket, limit, windowMs) {
      const ref = rates.doc(key(`${bucket}:${identity}`));
      return db.runTransaction(async (transaction) => {
        const data = (await transaction.get(ref)).data();
        const now = clock();
        const resetAt = data && data.resetAt.toMillis() > now ? data.resetAt.toMillis() : now + windowMs;
        const count = data && data.resetAt.toMillis() > now ? data.count : 0;
        if (count >= limit) return { allowed: false, retryAfter: Math.ceil((resetAt - now) / 1000) };
        transaction.set(ref, { count: count + 1, resetAt: new Date(resetAt), expiresAt: new Date(resetAt + 24 * 60 * 60 * 1000) });
        return { allowed: true };
      });
    },
    async clean() {
      // Bounded batches work in serverless requests without a background interval.
      for (const collection of [attempts, rates]) {
        const expired = await collection.where('expiresAt', '<=', new Date(clock())).limit(20).get();
        if (expired.empty) continue;
        const batch = db.batch();
        expired.docs.forEach((doc) => batch.delete(doc.ref, { lastUpdateTime: doc.updateTime }));
        try { await batch.commit(); }
        catch (error) { if (error.code !== 9) throw error; }
      }
    },
    async close() { await db.terminate(); },
  };
}
