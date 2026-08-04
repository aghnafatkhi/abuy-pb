import { NextRequest, NextResponse } from 'next/server';
import { 
  createSession, 
  joinSession, 
  getSession, 
  updateSession, 
  cleanExpiredSessions 
} from '@/lib/sessions';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  const session = await getSession(id);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  // Periodic cleanup of expired sessions
  if (Math.random() < 0.1) {
    await cleanExpiredSessions();
  }

  return NextResponse.json({
    ...session,
    serverTime: Date.now()
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    if (action === 'create') {
      const { creatorName, creatorId } = body;
      if (!creatorId) {
        return NextResponse.json({ error: 'Creator ID is required' }, { status: 400 });
      }
      const session = await createSession(creatorName || 'Player 1', creatorId);
      return NextResponse.json({
        ...session,
        serverTime: Date.now()
      });
    }

    if (action === 'join') {
      const { id, playerName, playerId } = body;
      if (!id || !playerId) {
        return NextResponse.json({ error: 'Session ID and Player ID are required' }, { status: 400 });
      }
      const result = await joinSession(id, playerName || 'Player 2', playerId);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({
        ...result.session,
        serverTime: Date.now()
      });
    }

    if (action === 'ready') {
      const { id, playerId, isReady } = body;
      if (!id || !playerId) {
        return NextResponse.json({ error: 'Session ID and Player ID are required' }, { status: 400 });
      }

      const updated = await updateSession(id, (session) => {
        if (session.players[playerId]) {
          session.players[playerId].isReady = isReady !== undefined ? !!isReady : true;
        }

        // Active players in session
        const activePlayers = Object.values(session.players).filter(p => p.active);
        
        // In online 2-player mode, BOTH active players must be present and BOTH must be ready!
        const allReady = activePlayers.length >= 2 && activePlayers.every(p => p.isReady);
        
        if (allReady) {
          session.status = 'countdown';
          // Start countdown 1 second from now to allow clock sync
          session.countdownStartAt = Date.now() + 1000;
          session.currentPhotoIndex = 0;
          session.step = 3; // Ensure both players are routed to Step 3 (Photo booth)
          
          // Clear all old photos for fresh photo shoot
          for (const pid of Object.keys(session.players)) {
            session.players[pid].photos = {};
            session.players[pid].livePhotos = {};
          }
        }
      });

      if (!updated) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
      return NextResponse.json({
        ...updated,
        serverTime: Date.now()
      });
    }

    if (action === 'update_config') {
      const { id, mode, memeId, overlayId, filterId, step } = body;
      if (!id) {
        return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
      }

      const updated = await updateSession(id, (session) => {
        if (mode !== undefined) session.mode = mode;
        if (memeId !== undefined) session.memeId = memeId;
        if (overlayId !== undefined) session.overlayId = overlayId;
        if (filterId !== undefined) session.filterId = filterId;
        if (step !== undefined) session.step = step;
      });

      if (!updated) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
      return NextResponse.json({
        ...updated,
        serverTime: Date.now()
      });
    }

    if (action === 'upload_photo') {
      const { id, playerId, index, photo, livePhotos } = body;
      if (!id || !playerId || index === undefined || !photo) {
        return NextResponse.json({ error: 'Session ID, Player ID, index, and photo are required' }, { status: 400 });
      }

      const updated = await updateSession(id, (session) => {
        const player = session.players[playerId];
        if (player) {
          if (!player.photos) player.photos = {};
          if (!player.livePhotos) player.livePhotos = {};
          player.photos[index] = photo;
          if (livePhotos) {
            player.livePhotos[index] = livePhotos;
          }
        }

        // Check if all active players uploaded their photo for this index
        const players = Object.values(session.players).filter(p => p.active);
        const all4Complete = [0, 1, 2, 3].every(i => players.length > 0 && players.every(p => p.photos && p.photos[i] !== undefined));

        if (all4Complete) {
          session.status = 'finished';
          session.step = 4;
          // Mark everyone as not ready for the next round
          for (const pId of Object.keys(session.players)) {
            session.players[pId].isReady = false;
          }
        } else {
          const allUploadedThisIndex = players.every(p => p.photos && p.photos[index] !== undefined);
          if (allUploadedThisIndex) {
            let nextIdx = index + 1;
            while (nextIdx < 4 && players.every(p => p.photos && p.photos[nextIdx] !== undefined)) {
              nextIdx++;
            }
            if (nextIdx >= 4) {
              nextIdx = [0, 1, 2, 3].find(i => !players.every(p => p.photos && p.photos[i] !== undefined)) ?? 3;
            }

            session.currentPhotoIndex = nextIdx;
            session.status = 'countdown';
            session.countdownStartAt = Date.now() + 1000;
          }
        }
      });

      if (!updated) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
      return NextResponse.json({
        ...updated,
        serverTime: Date.now()
      });
    }

    if (action === 'retake_photo') {
      const { id, index } = body;
      if (!id || index === undefined) {
        return NextResponse.json({ error: 'Session ID and index are required' }, { status: 400 });
      }

      const updated = await updateSession(id, (session) => {
        session.status = 'countdown';
        session.currentPhotoIndex = index;
        session.countdownStartAt = Date.now() + 1000;
        session.step = 3; // Ensure both players stay in Step 3 for the retake
        
        // Remove photo at index for all players so they take the frame together
        for (const pid of Object.keys(session.players)) {
          delete session.players[pid].photos[index];
          delete session.players[pid].livePhotos[index];
        }
      });

      if (!updated) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
      return NextResponse.json({
        ...updated,
        serverTime: Date.now()
      });
    }

    if (action === 'reset') {
      const { id } = body;
      if (!id) {
        return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
      }

      const updated = await updateSession(id, (session) => {
        session.status = 'waiting';
        session.currentPhotoIndex = 0;
        session.countdownStartAt = undefined;
        session.step = 2; // Route players back to Step 2 (Frame selection)
        for (const pid of Object.keys(session.players)) {
          session.players[pid].isReady = false;
          session.players[pid].photos = {};
          session.players[pid].livePhotos = {};
        }
      });

      if (!updated) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
      return NextResponse.json({
        ...updated,
        serverTime: Date.now()
      });
    }

    if (action === 'heartbeat') {
      const { id, playerId, liveCam } = body;
      if (!id || !playerId) {
        return NextResponse.json({ error: 'Session ID and Player ID are required' }, { status: 400 });
      }

      const updated = await updateSession(id, (session) => {
        const player = session.players[playerId];
        if (player) {
          player.lastSeen = Date.now();
          player.active = true;
          if (liveCam !== undefined) {
            player.liveCam = liveCam;
          }
        }

        // Mark players as inactive if no heartbeat in 45 seconds (handling blurred tabs and throttle)
        const now = Date.now();
        for (const [pid, p] of Object.entries(session.players)) {
          if (now - p.lastSeen > 45000) {
            p.active = false;
            p.isReady = false;
          }
        }
      });

      if (!updated) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
      return NextResponse.json({
        ...updated,
        serverTime: Date.now()
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e: any) {
    console.error('API Error:', e);
    return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
