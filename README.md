# 🎲 Last Call Roulette

A multiplayer web game combining Liar's Bar card game with Russian roulette mechanics. Play against AI bots or with friends in real-time!

## 🚀 Quick Start (Offline Mode)

**Easiest way to play:**
1. Open `offline.html` in any web browser
2. Enter your name and choose bot difficulty
3. Click "Start Game" - you're playing instantly!

No server, no setup, no dependencies needed.

## 🎮 Game Rules

- **Deck**: 20 cards (6×King, 6×Queen, 6×Ace, 2×Joker)
- **Players**: 2-8 players, each dealt 5 cards
- **Round Suit**: One card drawn from table deck (K/Q/A/Joker)
- **Gameplay**: Play face-down cards declaring they match the Round Suit
- **LIAR!**: Only the player to your left can call you out
- **Revolver**: 1/6 chance of elimination when caught lying or falsely accusing
- **Winner**: Last player standing

## 🎯 Game Modes

### Offline Mode (Recommended)
- **File**: `offline.html`
- **Features**: Play against 1-4 AI bots instantly
- **Difficulty**: Easy/Normal/Hard bot settings
- **No setup required** - just open in browser

### Online Multiplayer
- **Server**: Node.js + Socket.IO backend
- **Client**: React + Tailwind frontend
- **Features**: Real-time multiplayer, reconnection, lobby system

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+

### Offline Mode
```bash
# Just open offline.html in your browser!
open offline.html
```

### Online Mode
```bash
# Terminal 1 - Server
cd server
npm install
npm run dev

# Terminal 2 - Client  
cd client
npm install
npm run dev
```

### Standalone HTML (Online)
```bash
# Start server first
cd server && npm run dev

# Then open standalone.html
open client/standalone.html
```

## 📁 Project Structure

```
├── offline.html          # 🎯 Start here! Offline vs bots
├── client/
│   ├── standalone.html   # Online multiplayer (no build)
│   ├── src/             # React client source
│   └── package.json
├── server/
│   ├── src/             # Node.js server source
│   ├── __tests__/       # Jest unit tests
│   └── package.json
└── README.md
```

## 🤖 AI Bot Difficulties

- **Easy**: Rarely bluffs (10%), conservative LIAR calls (15%)
- **Normal**: Moderate bluffing (25%), balanced LIAR calls (35%)
- **Hard**: Aggressive bluffing (45%), frequent LIAR calls (60%)

## 🎨 Features

- ✅ **Server-authoritative** game logic
- ✅ **Real-time multiplayer** with Socket.IO
- ✅ **Reconnection support** with tokens
- ✅ **AI bots** with configurable difficulty
- ✅ **Responsive UI** (mobile-friendly)
- ✅ **Unit tests** for game logic
- ✅ **Offline mode** for instant play

## 🚀 Deployment

### Server
Deploy to any Node.js host (Render, Fly.io, Railway):
```bash
cd server
npm run build
npm start
```

### Client
Deploy to static hosting (Vercel, Netlify):
```bash
cd client
npm run build
# Upload dist/ folder
```

## 🧪 Testing

```bash
cd server
npm test
```

## 📝 License

MIT License - feel free to fork and modify!

---

**Ready to play?** Open `offline.html` and start your first game! 🎲

