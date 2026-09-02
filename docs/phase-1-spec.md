# Phase 1 Spec — Foundation + Core Chat

**Goal:** turn the video POC into a real app skeleton: log in with Google, land in a
Discord-like UI, see a server with text channels, and send messages that appear in
real time. Voice/video (already proven in Phase 0) gets wired into this shell in a
later phase.

**Build style:** spec first (this doc) → then build in **thin vertical slices**,
each one deployed to the live box so you validate it fast before we move on.

---

## Architecture

The backend grows from the single-purpose `token` service into a **modular monolith**
NestJS app called `api`. One process, clean module boundaries (so we *could* split
later, but won't now).

```
apps/
├── api/                       ← NestJS modular monolith (was: token)
│   └── src/
│       ├── auth/              ← Google OAuth, JWT cookie, guards
│       ├── users/            ← user profile, presence
│       ├── servers/          ← servers (guilds) + membership
│       ├── channels/         ← text/voice channels
│       ├── messages/         ← messages CRUD
│       ├── gateway/          ← Socket.IO realtime gateway
│       ├── livekit/          ← the existing token endpoint (moved here)
│       └── prisma/           ← Prisma client module
└── web/                       ← React + Vite (unchanged stack, new screens)

infra/
└── docker-compose.yml         ← adds `postgres`; `api` replaces `token`
```

**Containers on the box:** `postgres`, `api`, `livekit`, `caddy` (serves static web +
reverse-proxies `/api/*`, `/socket.io`, `/rtc`).

### Tech choices (with reasons)
- **Prisma** for the database — type-safe, one schema file, readable migrations. Best
  DX for learning; the generated client means the compiler catches bad queries.
- **PostgreSQL** — the standard relational DB; fits servers/channels/messages cleanly.
- **Google OAuth via Passport** (`passport-google-oauth20`) — battle-tested, minimal code.
- **JWT in an httpOnly cookie** — the browser can't read it (XSS-safe), sent automatically
  on every request and on the WebSocket handshake.
- **Socket.IO** (NestJS `@WebSocketGateway`) — handles reconnects/rooms for us; rooms = channels.

---

## Data model (Prisma)

```prisma
model User {
  id          String   @id @default(cuid())
  googleId    String   @unique
  email       String   @unique
  displayName String
  avatarUrl   String?
  createdAt   DateTime @default(now())
  memberships ServerMember[]
  messages    Message[]
}

model Server {                 // "guild" in Discord terms
  id        String   @id @default(cuid())
  name      String
  iconUrl   String?
  ownerId   String
  createdAt DateTime @default(now())
  members   ServerMember[]
  channels  Channel[]
}

model ServerMember {
  id        String   @id @default(cuid())
  serverId  String
  userId    String
  joinedAt  DateTime @default(now())
  server    Server   @relation(fields: [serverId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
  @@unique([serverId, userId])
}

model Channel {
  id        String      @id @default(cuid())
  serverId  String
  name      String
  type      ChannelType @default(TEXT)
  position  Int         @default(0)
  createdAt DateTime    @default(now())
  server    Server      @relation(fields: [serverId], references: [id])
  messages  Message[]
}

enum ChannelType { TEXT VOICE }

model Message {
  id        String   @id @default(cuid())
  channelId String
  authorId  String
  content   String
  createdAt DateTime @default(now())
  editedAt  DateTime?
  channel   Channel  @relation(fields: [channelId], references: [id])
  author    User     @relation(fields: [authorId], references: [id])
}
```

**Not in Phase 1** (later phases): roles, permissions, invites, DMs, reactions,
uploads, message edit/delete UI. Kept out on purpose to stay reviewable.

---

## Auth flow

1. Frontend "Sign in with Google" → `GET /api/auth/google`
2. Backend redirects to Google consent
3. Google → `GET /api/auth/google/callback` → backend upserts the `User`, signs a JWT,
   sets it as an httpOnly cookie, redirects to the app
4. `GET /api/auth/me` → returns the current user (or 401) — frontend uses this to know
   who's logged in
5. `POST /api/auth/logout` → clears the cookie

A NestJS **guard** protects all app routes + the WS handshake by validating the cookie.

---

## REST endpoints (all under `/api`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/auth/google` | start OAuth |
| GET | `/auth/google/callback` | OAuth return |
| GET | `/auth/me` | current user |
| POST | `/auth/logout` | log out |
| GET | `/servers` | servers I'm a member of |
| GET | `/servers/:id/channels` | channels in a server |
| GET | `/channels/:id/messages?before=&limit=50` | message history (paginated) |
| POST | `/channels/:id/messages` | send a message (also broadcasts over WS) |
| GET | `/health` | liveness check |

Server/channel **creation** endpoints come in a later slice; Phase 1 seeds one default
server + a couple of text channels so there's something to look at immediately.

---

## Realtime (Socket.IO gateway)

Auth: JWT cookie validated on the handshake. Rooms are channel IDs.

| Direction | Event | Payload |
|-----------|-------|---------|
| client→server | `channel.join` | `{ channelId }` |
| client→server | `channel.leave` | `{ channelId }` |
| server→room | `message.new` | `{ message }` |
| client→server | `typing.start` / `typing.stop` | `{ channelId }` |
| server→room | `typing` | `{ channelId, userId, isTyping }` |
| server→all | `presence.update` | `{ userId, status }` |

---

## Frontend (per project frontend-standards)

- **Pages:** `login` (Google button) and `app` (the main shell).
- **App shell** = server rail (left) + channel sidebar + message list + composer.
- Page components are thin shells; logic lives in colocated hooks; JSX only reads
  precomputed values; one component per file.
- **Data:** React Query hooks wrapping the API client (`use-me`, `use-servers`,
  `use-channels`, `use-messages`, `use-send-message`); a `use-socket` hook owns the
  Socket.IO connection and pushes realtime events into the Query cache.
- Router: React Router (`/login`, `/` app, guarded by auth).

---

## Build order — vertical slices (validate each on the box)

| Slice | Ships | You validate |
|-------|-------|--------------|
| **0** | `token`→`api`, Postgres+Prisma, `/api/health`, Caddy routes `/api/*` + `/socket.io` | site still loads; `https://…/api/health` → ok |
| **1** | Google login end-to-end + `/auth/me`; login page | click Google, land logged in, see your name+avatar |
| **2** | Discord-like app shell (static layout) | the UI skeleton renders |
| **3** | Seed default server + channels; list them in the sidebar | see server + channels |
| **4** | Text messages over REST (send + history) | send a message, reload, it's still there |
| **5** | Socket.IO realtime | two browsers → message appears instantly in both |
| **6** | Presence (online dot) + typing indicator | see who's online + "X is typing" |

---

## Dev + deploy workflow

**Fast local loop (during a slice):** run Postgres in Docker locally, `api` in NestJS
watch mode, `web` in Vite dev — hot reload, changes visible in seconds. Google OAuth
gets a `localhost` callback added alongside the production one.

**Per-slice deploy to the box (no registry, no tokens):**
```
# build images locally, stream them to the box over SSH, restart
docker compose build
docker save discord-api discord-web-caddy | gzip | ssh discord-poc 'gunzip | docker load'
ssh discord-poc 'cd ~/discord-clone/infra && sudo docker compose up -d'
```
Compose will reference fixed image tags (not build-on-box), so the 1 GB box only loads
and runs — never builds. A small `deploy.sh` wraps the three lines.

**Later:** GitHub Actions pipeline (build → push GHCR with the auto-scoped `GITHUB_TOKEN`
→ SSH deploy) replaces the manual step. Not now.

---

## Success criteria for Phase 1

Log in with Google on `https://yanchat.duckdns.org`, see the Discord-like shell with a
server + text channels, exchange messages with a friend in real time, and see presence.
Then Phase 2 layers on roles/permissions/invites, and the voice/video from Phase 0 gets
wired into channels.
