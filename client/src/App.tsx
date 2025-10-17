import { useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { createBot, type Difficulty, type BotHandle } from './bots';

type CardRank = 'K' | 'Q' | 'A' | 'JOKER';
type PlayerId = string;

interface Card { id: string; rank: CardRank }
interface PlayerState { id: PlayerId; name: string; hand: Card[]; isBot: boolean; connected: boolean; eliminated: boolean }
interface TableState { tableDeck: CardRank[]; currentRoundSuit?: CardRank; tableCards: { playerId: PlayerId; cardId: string; declared: CardRank }[] }
interface GameState { id: string; players: PlayerState[]; hostId: PlayerId; turnIndex: number; table: TableState; phase: 'lobby'|'dealing'|'playing'|'reveal'|'ended'; winnerId?: PlayerId }

const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [name, setName] = useState('You');
  const [token, setToken] = useState<string | null>(null);
  const [bots, setBots] = useState<BotHandle[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');

  useEffect(() => {
    const s = io(API_URL, { transports: ['websocket'] });
    s.on('state', (st: GameState) => setState(st));
    setSocket(s);
    return () => s.disconnect();
  }, []);

  useEffect(() => {
    if (!socket || !token) return;
    socket.emit('reconnectWithToken', { token }, (res: any) => {
      if (res?.error) return;
      setState(res.state);
    });
  }, [socket]);

  const me = useMemo(() => state?.players.find(p => p.name === name) || state?.players.find(p=>p.id===socket?.id), [state, name, socket?.id]);
  const myTurn = state && me && state.players.filter(p=>!p.eliminated).indexOf(me) === (state.turnIndex % state.players.filter(p=>!p.eliminated).length);
  const leftCanCall = state?.phase === 'reveal' && state && me?.id === leftPlayerId(state);

  function leftPlayerId(s: GameState): PlayerId | undefined {
    const alive = s.players.filter(p=>!p.eliminated);
    const cur = alive[s.turnIndex % alive.length];
    const curIdx = alive.findIndex(p=>p.id===cur.id);
    const leftIdx = (curIdx - 1 + alive.length) % alive.length;
    return alive[leftIdx]?.id;
  }

  const create = () => socket?.emit('createGame', { name }, (res: any) => {
    if (res?.error) return;
    setGameId(res.gameId);
    setState(res.state);
    setToken(res.token);
  });

  const join = () => gameId && socket?.emit('joinGame', { gameId, name }, (res: any) => {
    if (res?.error) return;
    setState(res.state);
    setToken(res.token);
  });

  const start = () => socket?.emit('start', {}, () => {});
  const play = (cardId: string, declared: CardRank) => socket?.emit('play', { cardId, declared }, () => {});
  const liar = () => socket?.emit('liar', {}, () => {});

  const addBot = () => {
    if (!gameId) return;
    const handle = createBot(API_URL, gameId, difficulty);
    setBots(prev=>[...prev, handle]);
  };
  const clearBots = () => {
    bots.forEach(b=>b.destroy());
    setBots([]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-5xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Last Call Roulette</h1>
        {!state || state.phase==='lobby' ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input className="px-3 py-2 rounded bg-slate-800" placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} />
              <button className="px-3 py-2 bg-emerald-600 rounded" onClick={create}>Create</button>
            </div>
            <div className="flex gap-2">
              <input className="px-3 py-2 rounded bg-slate-800" placeholder="Game ID" value={gameId||''} onChange={e=>setGameId(e.target.value)} />
              <button className="px-3 py-2 bg-blue-600 rounded" onClick={join}>Join</button>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm opacity-80">Bot difficulty</label>
              <select className="px-2 py-1 bg-slate-800 rounded" value={difficulty} onChange={e=>setDifficulty(e.target.value as Difficulty)}>
                <option value="easy">easy</option>
                <option value="normal">normal</option>
                <option value="hard">hard</option>
              </select>
              <button className="px-3 py-2 bg-teal-600 rounded" onClick={addBot} disabled={!gameId}>Add Bot</button>
              <button className="px-3 py-2 bg-slate-700 rounded" onClick={clearBots} disabled={bots.length===0}>Remove Bots</button>
            </div>
            {state && (
              <>
                <div className="text-sm opacity-75">Players:</div>
                <div className="flex gap-2 flex-wrap">
                  {state.players.map(p=> (
                    <div key={p.id} className="px-3 py-2 rounded bg-slate-800">{p.name}{p.eliminated?' (out)':''}</div>
                  ))}
                </div>
                <button className="px-3 py-2 bg-purple-600 rounded" onClick={start} disabled={(state.players.length<2)}>Start</button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div>Round Suit: <span className="font-semibold">{state.table.currentRoundSuit}</span></div>
              <div>Phase: {state.phase}</div>
              {state.winnerId && <div>Winner: {state.players.find(p=>p.id===state.winnerId)?.name}</div>}
            </div>
            <div className="flex gap-2 flex-wrap">
              {state.players.map((p)=>{
                const alive = !p.eliminated;
                const isTurn = alive && state.players.filter(pp=>!pp.eliminated).indexOf(p) === (state.turnIndex % state.players.filter(pp=>!pp.eliminated).length);
                return (
                  <div key={p.id} className={`px-3 py-2 rounded ${isTurn?'bg-emerald-700':'bg-slate-800'} ${!alive?'opacity-50':''}`}>
                    {p.name} {p.id===me?.id? '(you)': ''}
                  </div>
                )
              })}
            </div>
            <div>
              <div className="mb-2">Your hand</div>
              <div className="flex gap-2">
                {me?.hand.map(card => (
                  <button key={card.id} className="px-3 py-2 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-50"
                          disabled={!myTurn}
                          onClick={()=>{
                            const declared = state.table.currentRoundSuit || 'K';
                            play(card.id, declared);
                          }}>
                    {card.rank}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-3 py-2 bg-red-600 rounded disabled:opacity-50" disabled={!leftCanCall} onClick={liar}>Call LIAR!</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


