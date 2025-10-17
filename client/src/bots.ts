import { io, Socket } from 'socket.io-client';

export type Difficulty = 'easy' | 'normal' | 'hard';

type CardRank = 'K' | 'Q' | 'A' | 'JOKER';
type PlayerId = string;

interface Card { id: string; rank: CardRank }
interface PlayerState { id: PlayerId; name: string; hand: Card[]; isBot: boolean; connected: boolean; eliminated: boolean }
interface TableState { tableDeck: CardRank[]; currentRoundSuit?: CardRank; tableCards: { playerId: PlayerId; cardId: string; declared: CardRank }[] }
interface GameState { id: string; players: PlayerState[]; hostId: PlayerId; turnIndex: number; table: TableState; phase: 'lobby'|'dealing'|'playing'|'reveal'|'ended'; winnerId?: PlayerId }

export interface BotHandle {
  socket: Socket;
  name: string;
  difficulty: Difficulty;
  destroy: () => void;
}

function randomName(): string {
  const animals = ['Otter','Fox','Panda','Hawk','Lynx','Wolf','Bear','Moose','Seal','Whale'];
  return `Bot-${animals[Math.floor(Math.random()*animals.length)]}-${Math.floor(Math.random()*1000)}`;
}

export function createBot(serverUrl: string, gameId: string, difficulty: Difficulty = 'easy'): BotHandle {
  const socket = io(serverUrl, { transports: ['websocket'] });
  const name = randomName();
  let lastState: GameState | null = null;

  function isMyTurn(s: GameState): boolean {
    const alive = s.players.filter(p=>!p.eliminated);
    const my = s.players.find(p=>p.id===socket.id);
    if (!my) return false;
    return alive.indexOf(my) === (s.turnIndex % alive.length) && s.phase==='playing';
  }

  function leftPlayerId(s: GameState): PlayerId | undefined {
    const alive = s.players.filter(p=>!p.eliminated);
    const cur = alive[s.turnIndex % alive.length];
    const curIdx = alive.findIndex(p=>p.id===cur.id);
    const leftIdx = (curIdx - 1 + alive.length) % alive.length;
    return alive[leftIdx]?.id;
  }

  function maybeCallLiar(s: GameState) {
    const me = s.players.find(p=>p.id===socket.id);
    if (!me) return;
    if (s.phase !== 'reveal') return;
    if (leftPlayerId(s) !== me.id) return;
    // Heuristic: harder difficulties are more likely to call
    const base = difficulty==='easy' ? 0.15 : difficulty==='normal' ? 0.35 : 0.6;
    const rs = s.table.currentRoundSuit;
    const myCount = me.hand.filter(c=>c.rank===rs || rs==='JOKER' || c.rank==='JOKER').length;
    const weight = Math.min(0.9, base + (myCount>=3 ? 0.2 : 0));
    if (Math.random() < weight) {
      socket.emit('liar', {}, () => {});
    }
  }

  function chooseDeclared(s: GameState, card: Card): CardRank {
    const rs = s.table.currentRoundSuit || 'K';
    if (rs==='JOKER') return ['K','Q','A'][Math.floor(Math.random()*3)] as CardRank;
    // Bluff chance by difficulty
    const bluffChance = difficulty==='easy' ? 0.1 : difficulty==='normal' ? 0.25 : 0.45;
    const truthful = card.rank===rs || card.rank==='JOKER';
    if (!truthful && Math.random()>bluffChance) return rs;
    if (truthful && Math.random()<bluffChance) {
      // Minor bluff even if could tell truth
      return ['K','Q','A'].find(r=>r!==rs)! as CardRank;
    }
    return rs;
  }

  function act(s: GameState) {
    if (!isMyTurn(s)) return;
    const me = s.players.find(p=>p.id===socket.id);
    if (!me || me.hand.length===0) return;
    // prefer a matching card else any
    const rs = s.table.currentRoundSuit;
    const match = me.hand.find(c=>c.rank===rs || c.rank==='JOKER');
    const card = match || me.hand[0];
    const declared = chooseDeclared(s, card);
    socket.emit('play', { cardId: card.id, declared }, () => {});
  }

  socket.on('connect', () => {
    socket.emit('joinGame', { gameId, name, isBot: true }, () => {});
  });

  socket.on('state', (s: GameState) => {
    lastState = s;
    act(s);
    maybeCallLiar(s);
  });

  return {
    socket,
    name,
    difficulty,
    destroy: () => socket.disconnect()
  };
}


