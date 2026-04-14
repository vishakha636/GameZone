// Quiz/Trivia game logic — works for ANY number of players

const QUESTIONS = [
  { q: 'What does CPU stand for?',           options: ['Central Processing Unit','Core Power Unit','Central Power User','Core Processing Utility'], answer: 0 },
  { q: 'Which language runs in a web browser?', options: ['Java','C','Python','JavaScript'], answer: 3 },
  { q: 'What does HTTP stand for?',          options: ['HyperText Transfer Protocol','High Transfer Text Protocol','HyperText Transmission Process','High Text Transfer Procedure'], answer: 0 },
  { q: 'What is 2 to the power of 10?',      options: ['512','1024','2048','256'], answer: 1 },
  { q: 'Which data structure uses LIFO?',    options: ['Queue','Stack','Tree','Graph'], answer: 1 },
  { q: 'What does RAM stand for?',           options: ['Random Access Memory','Read Access Memory','Run Access Memory','Rapid Access Module'], answer: 0 },
  { q: 'Which company made the first iPhone?', options: ['Samsung','Nokia','Apple','Google'], answer: 2 },
  { q: 'What is the time complexity of binary search?', options: ['O(n)','O(n²)','O(log n)','O(1)'], answer: 2 },
];

const createState = (playerCount = 2) => ({
  questions:       QUESTIONS.slice(0, 5),
  currentQuestion: 0,
  scores:          {},
  answers:         {},   // { playerId: answerIndex } — reset each question
  status:          'active',
  playerCount,
});

const applyMove = (state, playerId, moveData) => {
  if (state.status !== 'active') return state;
  if (playerId in state.answers) return state;  // already answered

  const q         = state.questions[state.currentQuestion];
  const isCorrect = moveData.answerIndex === q.answer;
  const scores    = { ...state.scores, [playerId]: (state.scores[playerId] || 0) + (isCorrect ? 10 : 0) };
  const answers   = { ...state.answers, [playerId]: moveData.answerIndex };

  const allAnswered = Object.keys(answers).length >= state.playerCount;
  const nextQ       = state.currentQuestion + (allAnswered ? 1 : 0);
  const finished    = allAnswered && nextQ >= state.questions.length;

  return {
    ...state,
    scores,
    answers:         allAnswered ? {} : answers,
    currentQuestion: nextQ,
    status:          finished ? 'finished' : 'active',
  };
};

const getWinnerId = (state, players) => {
  const sorted = Object.entries(state.scores).sort((a, b) => b[1] - a[1]);
  if (!sorted.length) return null;
  const topScore = sorted[0][1];
  const tied = sorted.filter(([, s]) => s === topScore);
  if (tied.length > 1) return null;  // draw
  return sorted[0][0];
};

module.exports = { createState, applyMove, getWinnerId };
