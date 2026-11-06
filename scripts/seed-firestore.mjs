import { bank } from './questions.js';
import { levels } from '../server/levels.js';
import { firebaseDatabase } from '../server/firebase.js';
import { validateQuestions } from '../server/question-repository.js';

const db = firebaseDatabase();
try {
  const overwrite = process.argv.includes('--overwrite');
  const count = await db.runTransaction(async (transaction) => {
    const refs = levels.map((level) => db.collection('quiz_banks').doc(level.id));
    const existing = await transaction.getAll(...refs);
    let written = 0;
    levels.forEach((level, i) => {
      if (existing[i].exists && !overwrite) return;
      const questions = validateQuestions(bank[level.id]);
      transaction.set(refs[i], { questions, updatedAt: new Date(), version: 1 });
      written += questions.length;
    });
    return written;
  });
  console.log(`${count} questions imported. Existing levels are preserved unless --overwrite is specified.`);
} catch {
  console.error('Import failed. Verify the server credentials, Firebase project and Firestore permissions.');
  process.exitCode = 1;
} finally { await db.terminate(); }
