import { randomInt, randomUUID } from 'node:crypto';
import { levels } from './levels.js';

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function createAttempt(levelId, now = Date.now(), source) {
  const level = levels.find((item) => item.id === levelId);
  if (!level) return null;
  if (!Array.isArray(source) || source.length < 10) throw new Error('Question bank is not ready');
  const questions = shuffle(source).slice(0, 10).map((question) => {
    const options = shuffle(question.options.map((text, index) => ({ id: randomUUID(), text, correct: index === question.correct })));
    return { ...question, id: randomUUID(), options, correct: options.find((option) => option.correct).id };
  });
  return { level, questions, index: 0, answers: [], deadline: now + level.seconds * 1000, complete: false };
}

export function answerAttempt(attempt, questionId, optionId, now = Date.now()) {
  const question = attempt.questions[attempt.index];
  if (attempt.complete || question.id !== questionId) return false;
  // A replay returns the original correction without changing the score.
  if (attempt.answers.length > attempt.index) return true;
  if (optionId !== null && !question.options.some((option) => option.id === optionId)) return false;
  const timedOut = now >= attempt.deadline;
  const selected = timedOut ? null : optionId;
  attempt.answers.push({ questionId, selected, timedOut, correct: selected === question.correct });
  return true;
}

export function nextQuestion(attempt, questionId, now = Date.now()) {
  if (attempt.complete) return true;
  const previous = attempt.questions[attempt.index - 1];
  if (previous?.id === questionId) return true;
  if (attempt.questions[attempt.index].id !== questionId || attempt.answers.length <= attempt.index) return false;
  if (attempt.index === attempt.questions.length - 1) attempt.complete = true;
  else { attempt.index++; attempt.deadline = now + attempt.level.seconds * 1000; }
  return true;
}

function review(question, answer) {
  return {
    id: question.id, topic: question.topic, prompt: question.prompt, code: question.code,
    options: question.options.map(({ id, text }) => ({ id, text })),
    ...answer, correctOption: question.correct, explanation: question.explanation,
  };
}

export function publicAttempt(attempt, now = Date.now()) {
  const { level, questions, index, answers, complete } = attempt;
  const score = answers.filter((answer) => answer.correct).length;
  if (complete) return { phase: 'result', level, total: questions.length, score, review: questions.map((question, i) => review(question, answers[i])), serverTime: now };
  const question = questions[index];
  const feedback = answers[index] ? review(question, answers[index]) : null;
  return {
    phase: 'quiz', level, total: questions.length, index, answered: answers.length, score,
    deadline: attempt.deadline, serverTime: now,
    question: { id: question.id, topic: question.topic, prompt: question.prompt, code: question.code, options: question.options.map(({ id, text }) => ({ id, text })) },
    feedback,
  };
}
