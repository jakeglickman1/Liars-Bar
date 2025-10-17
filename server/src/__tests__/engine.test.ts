import { GameEngine } from '../game/GameEngine';

test('game start deals 5 cards and sets round suit', () => {
  const g = new GameEngine('g','p1','Host');
  g.addPlayer('p2','P2');
  expect(g.start()).toBe(true);
  expect(g.state.players.every(p=>p.hand.length===5)).toBe(true);
  expect(g.state.table.currentRoundSuit).toBeDefined();
});

test('only left player can call liar', () => {
  const g = new GameEngine('g','p1','Host', () => 0.9);
  g.addPlayer('p2','P2');
  g.start();
  const current = g.currentPlayer.id; // p1
  const cardId = g.state.players.find(p=>p.id===current)!.hand[0].id;
  expect(g.playCard(current, cardId, 'K')).toBe(true);
  // Right-side player is actually the next player (not allowed). Find a non-left player
  const notLeft = g.turnOrder().find(p=>p.id!==g.leftPlayerId())!.id;
  expect(g.liarCall(notLeft)).toBeNull();
});


