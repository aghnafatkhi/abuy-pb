import fs from 'fs';
import path from 'path';

export interface Player {
  id: string;
  name: string;
  isReady: boolean;
  active: boolean;
  photos: { [index: number]: string }; // index 0..3 -> base64 image data
  livePhotos: { [index: number]: string[] }; // index 0..3 -> array of base64 burst frames
  lastSeen: number;
}

export interface Session {
  id: string; // 4-letter room code
  status: 'waiting' | 'countdown' | 'taking' | 'finished';
  mode: 'freestyle' | 'meme';
  memeId: string;
  overlayId: string;
  filterId: string;
  countdownStartAt?: number; // timestamp when countdown should start
  currentPhotoIndex: number; // 0, 1, 2, 3
  players: { [playerId: string]: Player };
  updatedAt: number;
}

const STORAGE_FILE = '/tmp/photobooth_sessions.json';

// In-memory cache
let sessionsCache: { [id: string]: Session } = {};

function loadSessions(): { [id: string]: Session } {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf8');
      const parsed = JSON.parse(data);
      // Clean up sessions older than 2 hours
      const now = Date.now();
      const cleaned: { [id: string]: Session } = {};
      for (const [id, session] of Object.entries(parsed)) {
        if (now - (session as Session).updatedAt < 2 * 60 * 60 * 1000) {
          cleaned[id] = session as Session;
        }
      }
      sessionsCache = cleaned;
      return cleaned;
    }
  } catch (e) {
    console.error('Failed to load sessions from file:', e);
  }
  return sessionsCache;
}

function saveSessions(sessions: { [id: string]: Session }) {
  try {
    sessionsCache = sessions;
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(sessions, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save sessions to file:', e);
  }
}

export function getSession(id: string): Session | null {
  const sessions = loadSessions();
  const session = sessions[id.toUpperCase()];
  if (!session) return null;
  
  // Update last seen for active players to keep room alive
  return session;
}

export function createSession(creatorName: string, creatorId: string): Session {
  const sessions = loadSessions();
  
  // Generate random 4-letter room code
  let id = '';
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Easy to read, no confusing O/0 or I/1
  do {
    id = '';
    for (let i = 0; i < 4; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (sessions[id]);

  const newSession: Session = {
    id,
    status: 'waiting',
    mode: 'freestyle',
    memeId: 'pikachu',
    overlayId: 'classic-white',
    filterId: 'none',
    currentPhotoIndex: 0,
    players: {
      [creatorId]: {
        id: creatorId,
        name: creatorName || 'Player 1',
        isReady: false,
        active: true,
        photos: {},
        livePhotos: {},
        lastSeen: Date.now()
      }
    },
    updatedAt: Date.now()
  };

  sessions[id] = newSession;
  saveSessions(sessions);
  return newSession;
}

export function joinSession(id: string, playerName: string, playerId: string): Session | null {
  const sessions = loadSessions();
  const roomCode = id.toUpperCase();
  const session = sessions[roomCode];
  
  if (!session) return null;

  // If player already in session, update name
  if (session.players[playerId]) {
    session.players[playerId].name = playerName || session.players[playerId].name;
    session.players[playerId].active = true;
    session.players[playerId].lastSeen = Date.now();
  } else {
    // Check player count
    const playerCount = Object.keys(session.players).length;
    if (playerCount >= 2) {
      // Game already full
      return null;
    }
    
    session.players[playerId] = {
      id: playerId,
      name: playerName || `Player ${playerCount + 1}`,
      isReady: false,
      active: true,
      photos: {},
      livePhotos: {},
      lastSeen: Date.now()
    };
  }

  session.updatedAt = Date.now();
  saveSessions(sessions);
  return session;
}

export function updateSession(id: string, updater: (session: Session) => void): Session | null {
  const sessions = loadSessions();
  const roomCode = id.toUpperCase();
  const session = sessions[roomCode];
  
  if (!session) return null;

  updater(session);
  session.updatedAt = Date.now();
  saveSessions(sessions);
  return session;
}

export function cleanExpiredSessions() {
  const sessions = loadSessions();
  const now = Date.now();
  let changed = false;
  
  for (const [id, session] of Object.entries(sessions)) {
    // Purge rooms with no updates for over 1 hour
    if (now - session.updatedAt > 60 * 60 * 1000) {
      delete sessions[id];
      changed = true;
    }
  }
  
  if (changed) {
    saveSessions(sessions);
  }
}
