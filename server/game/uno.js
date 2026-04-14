// Simplified UNO game logic for 4 players

const COLORS  = ['red', 'green', 'blue', 'yellow'];
const NUMBERS = ['0','1','2','3','4','5','6','7','8','9'];
const ACTIONS = ['Skip','Reverse','Draw Two'];

const buildDeck = () => {
  const deck = [];
  COLORS.forEach(color => {
    NUMBERS.forEach(n => deck.push({ color, value: n, type: 'number' }));
    ACTIONS.forEach(a => deck.push({ color, value: a, type: 'action' }));
  });
  for (let i = 0; i < 4; i++) {
    deck.push({ color: 'wild', value: 'Wild', type: 'wild' });
    deck.push({ color: 'wild', value: 'Wild Draw Four', type: 'wild' });
  }
  return shuffle(deck);
};

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const createState = (playerIds) => {
  const deck    = buildDeck();
  const hands   = {};
  playerIds.forEach(id => { hands[id] = deck.splice(0, 7); });

  let topCard = deck.pop();
  while (topCard.type === 'wild') { deck.unshift(topCard); topCard = deck.pop(); }

  return {
    deck,
    hands,
    discardTop:   topCard,
    currentTurn:  playerIds[0],
    direction:    1,      // 1 = forward, -1 = reverse
    playerOrder:  playerIds,
    status:       'active',
    winner:       null,
    drawStack:    0,
  };
};

const canPlay = (card, topCard, chosenColor) => {
  const effectiveColor = chosenColor || topCard.color;
  if (card.type === 'wild') return true;
  if (card.color === effectiveColor) return true;
  if (card.value === topCard.value) return true;
  return false;
};

const playCard = (state, playerId, moveData) => {
  if (state.currentTurn !== playerId) return { error: 'Not your turn' };

  const { cardIndex, chosenColor } = moveData;
  const hand = [...(state.hands[playerId] || [])];
  const card = hand[cardIndex];
  if (!card) return { error: 'Card not found' };
  if (!canPlay(card, state.discardTop, state.chosenColor)) return { error: 'Cannot play that card' };

  hand.splice(cardIndex, 1);

  if (hand.length === 0) {
    return {
      ...state,
      hands: { ...state.hands, [playerId]: hand },
      discardTop: card,
      status: 'finished',
      winner: playerId,
    };
  }

  const newState = { ...state, hands: { ...state.hands, [playerId]: hand }, discardTop: card };
  const order    = state.playerOrder;
  const idx      = order.indexOf(playerId);

  if (card.value === 'Reverse') newState.direction *= -1;

  let nextIdx = (idx + newState.direction + order.length) % order.length;

  if (card.value === 'Skip') nextIdx = (nextIdx + newState.direction + order.length) % order.length;

  if (card.value === 'Draw Two') {
    const drawee = order[nextIdx];
    const deck   = [...newState.deck];
    newState.hands = { ...newState.hands, [drawee]: [...(newState.hands[drawee] || []), ...deck.splice(0, 2)] };
    newState.deck  = deck;
    nextIdx = (nextIdx + newState.direction + order.length) % order.length;
  }

  if (card.value === 'Wild Draw Four') {
    const drawee = order[nextIdx];
    const deck   = [...newState.deck];
    newState.hands = { ...newState.hands, [drawee]: [...(newState.hands[drawee] || []), ...deck.splice(0, 4)] };
    newState.deck  = deck;
    nextIdx = (nextIdx + newState.direction + order.length) % order.length;
  }

  newState.currentTurn  = order[nextIdx];
  newState.chosenColor  = card.type === 'wild' ? (chosenColor || 'red') : null;
  return newState;
};

const drawCard = (state, playerId) => {
  if (state.currentTurn !== playerId) return { error: 'Not your turn' };
  const deck = [...state.deck];
  if (!deck.length) return { error: 'Deck empty' };

  const card  = deck.pop();
  const hand  = [...(state.hands[playerId] || []), card];
  const order = state.playerOrder;
  const idx   = order.indexOf(playerId);
  const next  = order[(idx + state.direction + order.length) % order.length];

  return { ...state, deck, hands: { ...state.hands, [playerId]: hand }, currentTurn: next };
};

const getWinnerId = (state) => state.winner || null;

module.exports = { createState, playCard, drawCard, getWinnerId };
