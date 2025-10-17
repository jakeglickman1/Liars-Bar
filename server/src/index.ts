import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GameEngine } from './game/GameEngine';
import { v4 as uuid } from 'uuid';

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const games: Map<string, GameEngine> = new Map();
const socketToGame: Map<string, string> = new Map();
const reconTokens: Map<string, { gameId: string; playerId: string }> = new Map();

io.on('connection', (socket) => {
  socket.on('createGame', ({ name }, cb) => {
    const gameId = uuid();
    const engine = new GameEngine(gameId, socket.id, name || 'Host');
    games.set(gameId, engine);
    socket.join(gameId);
    socketToGame.set(socket.id, gameId);
    const token = uuid();
    reconTokens.set(token, { gameId, playerId: socket.id });
    cb?.({ gameId, state: engine.state, token });
    io.to(gameId).emit('state', engine.state);
  });

  socket.on('joinGame', ({ gameId, name, isBot }, cb) => {
    const engine = games.get(gameId);
    if (!engine) return cb?.({ error: 'Game not found' });
    const ok = engine.addPlayer(socket.id, name || 'Player', !!isBot);
    if (!ok) return cb?.({ error: 'Cannot join' });
    socket.join(gameId);
    socketToGame.set(socket.id, gameId);
    const token = uuid();
    reconTokens.set(token, { gameId, playerId: socket.id });
    cb?.({ state: engine.state, token });
    io.to(gameId).emit('state', engine.state);
  });

  socket.on('reconnectWithToken', ({ token }, cb) => {
    const info = reconTokens.get(token);
    if (!info) return cb?.({ error: 'Invalid token' });
    const engine = games.get(info.gameId);
    if (!engine) return cb?.({ error: 'Game not found' });
    socket.join(info.gameId);
    socketToGame.set(socket.id, info.gameId);
    cb?.({ state: engine.state });
    io.to(info.gameId).emit('state', engine.state);
  });

  socket.on('start', (_, cb) => {
    const gid = socketToGame.get(socket.id);
    if (!gid) return;
    const engine = games.get(gid)!;
    const ok = engine.start();
    cb?.({ ok });
    io.to(gid).emit('state', engine.state);
  });

  socket.on('play', ({ cardId, declared }, cb) => {
    const gid = socketToGame.get(socket.id);
    if (!gid) return;
    const engine = games.get(gid)!;
    const ok = engine.playCard(socket.id, cardId, declared);
    cb?.({ ok });
    io.to(gid).emit('state', engine.state);
  });

  socket.on('liar', (_, cb) => {
    const gid = socketToGame.get(socket.id);
    if (!gid) return;
    const engine = games.get(gid)!;
    const res = engine.liarCall(socket.id);
    cb?.(res);
    io.to(gid).emit('state', engine.state);
  });

  socket.on('disconnect', () => {
    const gid = socketToGame.get(socket.id);
    if (!gid) return;
    const engine = games.get(gid);
    if (!engine) return;
    engine.removePlayer(socket.id);
    io.to(gid).emit('state', engine.state);
  });
});

app.get('/health', (_req, res) => res.send('ok'));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log('Server listening on', PORT));


