// Mirrors server/config/gameConfig.js
// Keep in sync when adding new game types

const GAME_CONFIG = {
  tictactoe: { label: 'Tic Tac Toe',    icon: '⭕', players: 2, desc: '2 players · Classic board game' },
  quiz:      { label: 'Quiz Battle',    icon: '🧠', players: 2, desc: '2 players · 5 questions' },
  trivia3:   { label: '3-Player Trivia',icon: '🎯', players: 3, desc: '3 players · 5 questions' },
  ludo:      { label: 'Ludo',           icon: '🎲', players: 4, desc: '4 players · Roll & move' },
  uno:       { label: 'UNO',            icon: '🃏', players: 4, desc: '4 players · Card game' },
}

export default GAME_CONFIG
