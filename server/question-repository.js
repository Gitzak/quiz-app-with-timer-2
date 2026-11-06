import { levels } from './levels.js';

export function validateQuestions(questions) {
  if (!Array.isArray(questions) || questions.length < 10) throw new Error('At least ten questions are required for each level');
  const seen = new Set();
  for (const question of questions) {
    if (!question || typeof question.prompt !== 'string' || !question.prompt.trim() || typeof question.topic !== 'string' || typeof question.explanation !== 'string' || !question.explanation.trim()
      || !Array.isArray(question.options) || question.options.length !== 4 || question.options.some((option) => typeof option !== 'string' || !option.trim())
      || new Set(question.options).size !== 4 || !Number.isInteger(question.correct) || question.correct < 0 || question.correct >= 4
      || !(question.code === null || typeof question.code === 'string')) throw new Error('Invalid question bank');
    const id = question.prompt + '\n' + question.code;
    if (seen.has(id)) throw new Error('Duplicate question in bank');
    seen.add(id);
  }
  return questions.map(({ topic, prompt, options, correct, explanation, code }) => ({ topic, prompt, options, correct, explanation, code }));
}

export function createQuestionRepository(db, { prefix = 'quiz_' } = {}) {
  const collection = db.collection(`${prefix}banks`);
  return {
    async load(levelId) {
      if (!levels.some((level) => level.id === levelId)) throw new Error('Unknown question level');
      const doc = await collection.doc(levelId).get();
      if (!doc.exists) throw new Error('Question bank is missing; run npm run firebase:seed');
      return validateQuestions(doc.data().questions);
    },
  };
}
