export type CardRank = 'K' | 'Q' | 'A' | 'JOKER';

export interface Card { id: string; rank: CardRank; }

export type PlayerId = string;

export interface PlayerState {
  id: PlayerId;
  name: string;
  hand: Card[];
  isBot: boolean;
  connected: boolean;
  eliminated: boolean;
}

export interface TableState {
  tableDeck: CardRank[];
  currentRoundSuit?: CardRank;
  tableCards: { playerId: PlayerId; cardId: string; declared: CardRank }[];
}

export interface GameState {
  id: string;
  players: PlayerState[];
  hostId: PlayerId;
  turnIndex: number;
  table: TableState;
  phase: 'lobby' | 'dealing' | 'playing' | 'reveal' | 'ended';
  winnerId?: PlayerId;
}

export interface LiarCallResult { truth: boolean; spinner: PlayerId; eliminated?: PlayerId; }


