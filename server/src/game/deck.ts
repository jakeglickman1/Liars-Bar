import { Card, CardRank } from '../types';
import { v4 as uuid } from 'uuid';

export function generateMainDeck(): Card[] {
  const ranks: CardRank[] = ['K', 'Q', 'A'];
  const deck: Card[] = [];
  for (const rank of ranks) {
    for (let i = 0; i < 6; i++) deck.push({ id: uuid(), rank });
  }
  for (let i = 0; i < 2; i++) deck.push({ id: uuid(), rank: 'JOKER' });
  return shuffle(deck);
}

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function drawTableDeck(): CardRank[] {
  const pool: CardRank[] = ['K', 'Q', 'A', 'JOKER'];
  const result: CardRank[] = [];
  for (let i = 0; i < 4; i++) result.push(pool[i]);
  return shuffle(result);
}


