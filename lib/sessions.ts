import { db } from './firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch 
} from 'firebase/firestore';

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
  step: number; // Current active step (1-5)
  creatorId: string; // ID of the player who created the room
  mode: 'freestyle' | 'meme';
  memeId: string;
  overlayId: string;
  filterId: string;
  countdownStartAt?: number; // timestamp when countdown should start
  currentPhotoIndex: number; // 0, 1, 2, 3
  players: { [playerId: string]: Player };
  updatedAt: number;
}

// Global in-memory cache to ensure instant multiplayer sync and zero quota dependency
declare global {
  var __sessionsMap: Map<string, Session> | undefined;
  var __firestoreQuotaExceeded: boolean | undefined;
}

if (!globalThis.__sessionsMap) {
  globalThis.__sessionsMap = new Map<string, Session>();
}

if (globalThis.__firestoreQuotaExceeded === undefined) {
  globalThis.__firestoreQuotaExceeded = true;
}

const memoryStore = globalThis.__sessionsMap;

function isQuotaError(e: any): boolean {
  if (!e) return false;
  const msg = String(e?.message || e?.code || e).toLowerCase();
  return (
    e?.code === 'resource-exhausted' ||
    msg.includes('quota') ||
    msg.includes('exhausted') ||
    msg.includes('resource_exhausted') ||
    msg.includes('code: 8')
  );
}

function markQuotaExceeded(e: any) {
  if (isQuotaError(e) && !globalThis.__firestoreQuotaExceeded) {
    globalThis.__firestoreQuotaExceeded = true;
    console.warn('[SessionStore] Firestore quota limit reached. Auto-switched to High-Speed Server Memory Relay mode.');
  }
}

export async function getSession(id: string): Promise<Session | null> {
  const roomCode = id.toUpperCase();
  
  // 1. Check in-memory store first
  if (memoryStore.has(roomCode)) {
    return memoryStore.get(roomCode) || null;
  }

  // 2. Fallback to Firestore if not in memory and quota not exceeded
  if (!globalThis.__firestoreQuotaExceeded) {
    try {
      const docRef = doc(db, 'sessions', roomCode);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const session = docSnap.data() as Session;
        memoryStore.set(roomCode, session);
        return session;
      }
    } catch (e) {
      markQuotaExceeded(e);
    }
  }

  return null;
}

export async function createSession(creatorName: string, creatorId: string): Promise<Session> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Easy to read, no confusing O/0 or I/1
  let id = '';
  
  // Generate unique 4-char code
  for (let attempt = 0; attempt < 10; attempt++) {
    id = '';
    for (let i = 0; i < 4; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (!memoryStore.has(id)) {
      break;
    }
  }
  
  if (memoryStore.has(id)) {
    id = 'ROOM' + Math.floor(1000 + Math.random() * 9000);
  }

  const newSession: Session = {
    id,
    status: 'waiting',
    step: 2,
    creatorId,
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

  // Save to memory immediately
  memoryStore.set(id, newSession);

  // Background persist to Firestore if available
  if (!globalThis.__firestoreQuotaExceeded) {
    try {
      const docRef = doc(db, 'sessions', id);
      await setDoc(docRef, newSession);
    } catch (e) {
      markQuotaExceeded(e);
    }
  }

  return newSession;
}

export async function joinSession(id: string, playerName: string, playerId: string): Promise<{ success: boolean; session?: Session; error?: string }> {
  try {
    const roomCode = id.toUpperCase();
    let session = await getSession(roomCode);
    
    if (!session) {
      return { success: false, error: `Room "${roomCode}" tidak ditemukan. Pastikan kode room sudah benar.` };
    }

    const now = Date.now();

    // If player already in session, update name & lastSeen
    if (session.players[playerId]) {
      session.players[playerId].name = playerName || session.players[playerId].name;
      session.players[playerId].active = true;
      session.players[playerId].lastSeen = now;
    } else {
      // Prune stale/inactive players who haven't sent a heartbeat in 50 seconds
      for (const [pId, p] of Object.entries(session.players)) {
        if (!p.active || now - p.lastSeen > 50000) {
          delete session.players[pId];
        }
      }

      // Check active players count
      const activePlayers = Object.values(session.players).filter(p => p.active && now - p.lastSeen < 50000);
      
      if (activePlayers.length >= 2) {
        const playerNames = activePlayers.map(p => p.name).join(' & ');
        return { 
          success: false, 
          error: `Room penuh. Sudah ada 2 pemain aktif (${playerNames}) di dalam room ini.` 
        };
      }
      
      const playerCount = Object.keys(session.players).length;
      session.players[playerId] = {
        id: playerId,
        name: playerName || `Player ${playerCount + 1}`,
        isReady: false,
        active: true,
        photos: {},
        livePhotos: {},
        lastSeen: now
      };
    }

    session.updatedAt = now;
    memoryStore.set(roomCode, session);

    // Try Firestore persist
    if (!globalThis.__firestoreQuotaExceeded) {
      try {
        const docRef = doc(db, 'sessions', roomCode);
        await setDoc(docRef, session);
      } catch (e) {
        markQuotaExceeded(e);
      }
    }

    return { success: true, session };
  } catch (e: any) {
    console.error('Error joining session:', e);
    return { success: false, error: `Terjadi kesalahan saat bergabung dengan room: ${e.message}` };
  }
}

export async function updateSession(id: string, updater: (session: Session) => void): Promise<Session | null> {
  try {
    const roomCode = id.toUpperCase();
    let session = await getSession(roomCode);
    
    if (!session) return null;

    updater(session);
    session.updatedAt = Date.now();
    
    // Update memory
    memoryStore.set(roomCode, session);

    // Try Firestore persist
    if (!globalThis.__firestoreQuotaExceeded) {
      try {
        const docRef = doc(db, 'sessions', roomCode);
        await setDoc(docRef, session);
      } catch (e) {
        markQuotaExceeded(e);
      }
    }

    return session;
  } catch (e) {
    console.error('Error updating session:', e);
    return null;
  }
}

export async function cleanExpiredSessions() {
  try {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    
    // Clean memory
    for (const [id, session] of memoryStore.entries()) {
      if (session.updatedAt < oneHourAgo) {
        memoryStore.delete(id);
      }
    }

    // Try clean Firestore
    if (!globalThis.__firestoreQuotaExceeded) {
      const sessionsCol = collection(db, 'sessions');
      const q = query(sessionsCol, where('updatedAt', '<', oneHourAgo));
      const querySnapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      let count = 0;
      querySnapshot.forEach((docSnap) => {
        batch.delete(docSnap.ref);
        count++;
      });
      
      if (count > 0) {
        await batch.commit();
      }
    }
  } catch (e) {
    markQuotaExceeded(e);
  }
}

