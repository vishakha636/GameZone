// Central configuration for every game type.
// To add a new game:
//   1. Add entry here
//   2. Create server/game/<yourGame>.js
//   3. Register it in services/gameRoomManager.js
//   4. Create client component + register in LobbyPage

const GAME_CONFIG = {
  tictactoe: {
    label:      'Tic Tac Toe',
    icon:       '⭕',
    players:    2,
    symbols:    ['X', 'O'],
    desc:       '2 players · Classic board game',
    turnBased:  true,
  },
  quiz: {
    label:      'Quiz Battle',
    icon:       '🧠',
    players:    2,
    symbols:    [],
    desc:       '2 players · 5 questions',
    turnBased:  false,
  },
  trivia3: {
    label:      '3-Player Trivia',
    icon:       '🎯',
    players:    3,
    symbols:    [],
    desc:       '3 players · 5 questions',
    turnBased:  false,
  },
  ludo: {
    label:      'Ludo',
    icon:       '🎲',
    players:    4,
    symbols:    ['R', 'G', 'B', 'Y'],
    desc:       '4 players · Roll & move',
    turnBased:  true,
  },
  uno: {
    label:      'UNO',
    icon:       '🃏',
    players:    4,
    symbols:    [],
    desc:       '4 players · Card game',
    turnBased:  true,
  },
};

module.exports = GAME_CONFIG;
