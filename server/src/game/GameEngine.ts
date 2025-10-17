import { Card, CardRank, GameState, LiarCallResult, PlayerId, PlayerState } from '../types';
import { generateMainDeck, drawTableDeck } from './deck';

export class GameEngine {
  state: GameState;
  private deck: Card[] = [];
  private lastPlayed: Card | null = null;
  private rng: () => number;

  constructor(id: string, hostId: PlayerId, hostName: string, rng: () => number = Math.random) {
    this.state = {
      id,
      players: [this.createPlayer(hostId, hostName, false)],
      hostId,
      turnIndex: 0,
      table: { tableDeck: [], tableCards: [] },
      phase: 'lobby',
    };
    this.rng = rng;
  }

  private createPlayer(id: PlayerId, name: string, isBot: boolean): PlayerState {
    return { id, name, isBot, hand: [], connected: true, eliminated: false };
  }

  addPlayer(id: PlayerId, name: string, isBot = false): boolean {
    if (this.state.phase !== 'lobby') return false;
    if (this.state.players.length >= 8) return false;
    if (this.state.players.find((p) => p.id === id)) return false;
    this.state.players.push(this.createPlayer(id, name, isBot));
    return true;
  }

  removePlayer(id: PlayerId) {
    const p = this.state.players.find((p) => p.id === id);
    if (p) p.connected = false;
  }

  start(): boolean {
    if (this.state.phase !== 'lobby') return false;
    if (this.state.players.length < 2) return false;
    this.state.phase = 'dealing';
    this.deck = generateMainDeck();
    this.state.table.tableDeck = drawTableDeck();
    for (const player of this.state.players) player.hand = [];
    for (let r = 0; r < 5; r++) {
      for (const player of this.turnOrder()) {
        const card = this.deck.pop();
        if (card) player.hand.push(card);
      }
    }
    this.state.table.currentRoundSuit = this.state.table.tableDeck.pop();
    this.state.phase = 'playing';
    this.state.turnIndex = 0;
    this.state.table.tableCards = [];
    return true;
  }

  private turnOrder(): PlayerState[] {
    return this.state.players.filter((p) => !p.eliminated);
  }

  get currentPlayer(): PlayerState {
    const order = this.turnOrder();
    return order[this.state.turnIndex % order.length];
  }

  playCard(playerId: PlayerId, cardId: string, declared: CardRank): boolean {
    if (this.state.phase !== 'playing') return false;
    if (this.currentPlayer.id !== playerId) return false;
    const player = this.state.players.find((p) => p.id === playerId)!;
    const idx = player.hand.findIndex((c) => c.id === cardId);
    if (idx === -1) return false;
    const card = player.hand.splice(idx, 1)[0];
    this.lastPlayed = card;
    this.state.table.tableCards.push({ playerId, cardId: card.id, declared });
    this.state.phase = 'reveal';
    return true;
  }

  leftPlayerId(): PlayerId {
    const order = this.turnOrder();
    const cur = this.currentPlayer;
    const curIdx = order.findIndex((p) => p.id === cur.id);
    const leftIdx = (curIdx - 1 + order.length) % order.length;
    return order[leftIdx].id;
  }

  liarCall(callerId: PlayerId): LiarCallResult | null {
    if (this.state.phase !== 'reveal') return null;
    if (callerId !== this.leftPlayerId()) return null;
    const lastPlay = this.state.table.tableCards[this.state.table.tableCards.length - 1];
    if (!lastPlay) return null;
    const declared = lastPlay.declared;
    const truth = this.wasTruth(declared);
    const spinner = truth ? callerId : this.currentPlayer.id;
    const eliminated = this.spinRevolver() ? spinner : undefined;
    if (eliminated) this.eliminate(eliminated);
    this.advanceAfterReveal();
    return { truth, spinner, eliminated };
  }

  private wasTruth(declared: CardRank): boolean {
    if (!this.lastPlayed)
      return (
        declared === this.state.table.currentRoundSuit || declared === 'JOKER'
      );
    return (
      this.lastPlayed.rank === declared ||
      this.lastPlayed.rank === 'JOKER' ||
      this.state.table.currentRoundSuit === 'JOKER'
    );
  }

  private spinRevolver(): boolean {
    return Math.floor(this.rng() * 6) === 0;
  }

  private eliminate(playerId: PlayerId) {
    const p = this.state.players.find((p) => p.id === playerId);
    if (p) p.eliminated = true;
    const survivors = this.turnOrder();
    if (survivors.length === 1) {
      this.state.winnerId = survivors[0].id;
      this.state.phase = 'ended';
    }
  }

  private advanceAfterReveal() {
    if (this.state.phase === 'ended') return;
    this.state.phase = 'playing';
    this.state.turnIndex = (this.state.turnIndex + 1) % this.turnOrder().length;
    const allEmpty = this.state
      .players
      .filter((p) => !p.eliminated)
      .every((p) => p.hand.length === 0);
    if (allEmpty) {
      this.state.winnerId = this.turnOrder()[0].id;
      this.state.phase = 'ended';
    }
  }
}


