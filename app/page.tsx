'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Users, 
  User, 
  Copy, 
  Check, 
  RefreshCw, 
  Download, 
  Play, 
  Zap, 
  HelpCircle, 
  Maximize, 
  FileText, 
  Grid, 
  Sparkles, 
  Smile, 
  Award, 
  Heart, 
  Film,
  CameraOff,
  Upload,
  RotateCcw,
  Share2,
  Volume2,
  VolumeX,
  ChevronRight,
  ChevronLeft,
  XCircle,
  StopCircle,
  Lock
} from 'lucide-react';
import { draw2RStrip, draw4RLayout } from '@/lib/draw-booth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Inline module declaration for gifshot to bypass TypeScript type-checking issues
declare const window: any;

interface Player {
  id: string;
  name: string;
  isReady: boolean;
  active: boolean;
  photos: { [index: number]: string };
  livePhotos: { [index: number]: string[] };
}

interface Session {
  id: string;
  status: 'waiting' | 'countdown' | 'taking' | 'finished';
  step: number;
  creatorId: string;
  mode: 'freestyle' | 'meme';
  memeId: string;
  overlayId: string;
  filterId: string;
  countdownStartAt?: number;
  currentPhotoIndex: number;
  players: { [playerId: string]: Player };
}

const MEMES = [
  {
    id: 'pikachu',
    name: 'Surprised Pikachu',
    emoji: '😲',
    desc: 'Mouth wide open in an "O", eyes rounded in absolute mock shock and disbelief.',
    svg: (
      <svg viewBox="0 0 100 100" className="w-24 h-24 stroke-amber-500 fill-amber-100/50" strokeWidth="2">
        <circle cx="50" cy="50" r="40" />
        <circle cx="35" cy="45" r="5" fill="black" />
        <circle cx="65" cy="45" r="5" fill="black" />
        <ellipse cx="50" cy="65" rx="8" ry="12" fill="#e11d48" stroke="black" />
        <circle cx="22" cy="58" r="7" fill="#ef4444" />
        <circle cx="78" cy="58" r="7" fill="#ef4444" />
        {/* Ears */}
        <path d="M20,25 L30,12 L35,22 Z" fill="black" />
        <path d="M80,25 L70,12 L65,22 Z" fill="black" />
      </svg>
    )
  },
  {
    id: 'drake',
    name: 'Disapproving Drake',
    emoji: '🙅',
    desc: 'Hand flat up next to face, palm outward pushing away, head turned in disgust.',
    svg: (
      <svg viewBox="0 0 100 100" className="w-24 h-24 stroke-orange-500 fill-orange-100/50" strokeWidth="2">
        <circle cx="50" cy="50" r="40" />
        {/* Disapproving eyes */}
        <path d="M30,42 L42,46" stroke="black" />
        <path d="M70,42 L58,46" stroke="black" />
        {/* Rejecting hand */}
        <path d="M12,50 C12,40 22,40 22,50 L22,70 C22,75 12,75 12,70 Z" fill="#ffedd5" stroke="black" />
        <path d="M35,68 Q50,78 65,68" stroke="black" fill="none" />
        {/* Turn indicator */}
        <path d="M75,30 L85,25 L80,35" stroke="orange" fill="none" />
      </svg>
    )
  },
  {
    id: 'success-kid',
    name: 'Success Kid',
    emoji: '✊',
    desc: 'Clenched fist held tight, determined facial squint, smug expression of pure victory.',
    svg: (
      <svg viewBox="0 0 100 100" className="w-24 h-24 stroke-emerald-500 fill-emerald-100/50" strokeWidth="2">
        <circle cx="50" cy="50" r="40" />
        {/* Squinty eyes */}
        <path d="M30,42 Q37,47 42,43" stroke="black" fill="none" />
        <path d="M58,43 Q63,47 70,42" stroke="black" fill="none" />
        {/* Smug mouth */}
        <path d="M35,62 Q48,52 65,60" stroke="black" fill="none" />
        {/* Clenched fist */}
        <circle cx="50" cy="75" r="10" fill="#ecfdf5" stroke="black" />
        <path d="M47,70 L47,80 M50,70 L50,80 M53,70 L53,80" stroke="black" />
      </svg>
    )
  },
  {
    id: 'distracted-bf',
    name: 'Stunned Distraction',
    emoji: '😮',
    desc: 'Extremely exaggerated shocked look, eyes bulging, mouth open looking backwards.',
    svg: (
      <svg viewBox="0 0 100 100" className="w-24 h-24 stroke-sky-500 fill-sky-100/50" strokeWidth="2">
        <circle cx="50" cy="50" r="40" />
        {/* Wide shock eyes */}
        <circle cx="35" cy="45" r="7" fill="white" stroke="black" />
        <circle cx="35" cy="45" r="3" fill="black" />
        <circle cx="65" cy="45" r="7" fill="white" stroke="black" />
        <circle cx="65" cy="45" r="3" fill="black" />
        {/* Wide open mouth */}
        <circle cx="50" cy="68" r="8" fill="black" />
        {/* Turning sideways */}
        <path d="M15,35 Q10,45 15,55" stroke="sky" strokeWidth="3" fill="none" />
      </svg>
    )
  },
  {
    id: 'chloe',
    name: 'Side-Eye Chloe',
    emoji: '😒',
    desc: 'Extreme squinty side-eye look, highly unimpressed, suspicious, and judgmental mouth.',
    svg: (
      <svg viewBox="0 0 100 100" className="w-24 h-24 stroke-pink-500 fill-pink-100/50" strokeWidth="2">
        <circle cx="50" cy="50" r="40" />
        {/* Side eye */}
        <path d="M28,45 L42,45" stroke="black" />
        <circle cx="38" cy="45" r="2" fill="black" />
        <path d="M58,45 L72,45" stroke="black" />
        <circle cx="68" cy="45" r="2" fill="black" />
        {/* Suspicious flat mouth */}
        <path d="M38,62 L62,58" stroke="black" strokeWidth="2" />
        {/* Eyebrows */}
        <path d="M28,38 Q35,35 42,38" stroke="black" fill="none" />
        <path d="M58,38 Q65,40 72,36" stroke="black" fill="none" />
      </svg>
    )
  }
];

const MEME_POSES = MEMES.map(m => ({ ...m, title: m.name }));

const OVERLAYS = [
  { id: 'classic-white', name: 'Classic Pure White', borderClass: 'border-pink-100 bg-white text-gray-900 shadow-xs', desc: 'Bingkai putih bersih minimalis.', bg: '#ffffff', text: '#1e293b' },
  { id: 'soft-pink-coquette', name: 'Soft Coquette Pink', borderClass: 'border-pink-200 bg-pink-50 text-pink-700 shadow-xs', desc: 'Warna pink pastel manis dengan aksen ribbon.', bg: '#fff0f5', text: '#db2777' },
  { id: 'kawaii-sweet', name: 'Kawaii Sweet Lavender', borderClass: 'border-pink-200 bg-purple-50 text-pink-600 shadow-xs', desc: 'Sentuhan warna pastel lilac dan bintang.', bg: '#faf5ff', text: '#ec4899' },
  { id: 'y2k-sparkle', name: 'Y2K Sparkle Pink', borderClass: 'border-pink-300 bg-pink-100 text-purple-700 shadow-xs', desc: 'Warna pink kilau dengan bintang vektor.', bg: '#fce7f3', text: '#7e22ce' },
  { id: 'retro-cinema', name: 'Retro Cinema Film', borderClass: 'border-neutral-800 bg-neutral-900 text-yellow-400 shadow-xs', desc: 'Format klise film klasik bernuansa bioskop.', bg: '#171717', text: '#eab308' },
  { id: 'pastel-cream', name: 'Warm Cream Latte', borderClass: 'border-amber-100 bg-amber-50 text-amber-900 shadow-xs', desc: 'Warna krem hangat aesthetic ala kafe.', bg: '#fffbeb', text: '#78350f' }
];

const FILTERS = [
  { id: 'none', name: 'Clean Normal', class: '', desc: 'Tone warna alami tanpa efek' },
  { id: 'soft-pink', name: 'Soft Pink Glow', class: 'sepia-[0.18] hue-rotate-[320deg] saturate-[1.35] brightness-[1.05]', desc: 'Rona pink blush romantis' },
  { id: 'korean-white', name: 'Korean Soft Bright', class: 'brightness-[1.12] contrast-[0.93] saturate-[1.06]', desc: 'Cerah halus porselen' },
  { id: 'vintage-warm', name: 'Vintage Warm', class: 'sepia-[0.45] contrast-[1.08] saturate-[1.15] brightness-[0.98]', desc: 'Nostalgia hangat klasik' },
  { id: 'rose-gold', name: 'Rose Gold Glow', class: 'sepia-[0.25] hue-rotate-[335deg] saturate-[1.4] brightness-[1.04]', desc: 'Kilau emas ke-pink-an' },
  { id: 'retro-90s', name: 'Retro 90s Polaroid', class: 'contrast-[0.92] saturate-[1.12] brightness-[1.04] hue-rotate-[350deg]', desc: 'Gaya foto analog 90an' },
  { id: 'moody-mono', name: 'Moody Black & White', class: 'grayscale contrast-[1.3] brightness-[0.95]', desc: 'Hitam putih kontras elegan' },
  { id: 'peach-cream', name: 'Peach Cream', class: 'sepia-[0.2] hue-rotate-[305deg] saturate-[1.3] brightness-[1.06]', desc: 'Kehangatan buah persik' },
  { id: 'soft-cool', name: 'Soft Cool Tone', class: 'hue-rotate-[185deg] saturate-[0.85] brightness-[1.06]', desc: 'Tone sejuk pastel' },
  { id: 'golden-hour', name: 'Golden Hour', class: 'sepia-[0.35] saturate-[1.45] brightness-[1.02] contrast-[1.05]', desc: 'Cahaya senja keemasan' },
  { id: 'dreamy-fade', name: 'Dreamy Soft Glow', class: 'brightness-[1.08] contrast-[0.88] saturate-[0.95]', desc: 'Efek dreamy pudar lembut' },
  { id: 'film-mono', name: 'Soft Film Mono', class: 'grayscale contrast-[1.05] brightness-[1.02]', desc: 'Hitam putih vintage halus' }
];

const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(key);
      }
    } catch (e) {
      console.warn('localStorage is blocked or not available', e);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn('localStorage is blocked or not available', e);
    }
  }
};

export default function PhotoboothPage() {
  const [playerId, setPlayerId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [view, setView] = useState<'lobby' | 'booth' | 'gallery'>('lobby');
  const [lobbyMode, setLobbyMode] = useState<'solo' | 'multiplayer'>('solo');
  const [roomCode, setRoomCode] = useState<string>('');
  const [roomIdInput, setRoomIdInput] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  
  // Real-time states
  const [session, setSession] = useState<Session | null>(null);
  const [clockOffset, setClockOffset] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  
  // Local sequence states for continuous automated photo shoot
  const [localShootActive, setLocalShootActive] = useState<boolean>(false);
  const [localPhotoIndex, setLocalPhotoIndex] = useState<number>(0);

  const localShootActiveRef = useRef<boolean>(false);
  const localPhotoIndexRef = useRef<number>(0);

  useEffect(() => {
    localShootActiveRef.current = localShootActive;
  }, [localShootActive]);

  useEffect(() => {
    localPhotoIndexRef.current = localPhotoIndex;
  }, [localPhotoIndex]);
  
  // Local States (Fallback for Solo Mode or Local Setup)
  const [soloSession, setSoloSession] = useState<Session>({
    id: '',
    status: 'waiting',
    step: 1,
    creatorId: '',
    mode: 'freestyle',
    memeId: 'pikachu',
    overlayId: 'classic-white',
    filterId: 'none',
    currentPhotoIndex: 0,
    players: {}
  });

  // Sound Effects State
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = safeLocalStorage.getItem('photobooth_sound_enabled');
    if (saved !== null) return saved === 'true';
    return true;
  });
  const soundEnabledRef = useRef<boolean>(soundEnabled);

  // Step-by-Step Workflow State (1: Profil, 2: Frame, 3: Booth, 4: Filter, 5: Download)
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const stepRef = useRef<number>(1);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);
  const [maxReachedStep, setMaxReachedStep] = useState<number>(1);

  const goToStep = (targetStep: 1 | 2 | 3 | 4 | 5) => {
    const currentStep = step as number;
    if (targetStep === 3) {
      setView('booth');
      startCamera();
    } else if (currentStep === 3) {
      stopCamera();
    }
    if (targetStep === 1) {
      setView('lobby');
    }
    if (targetStep === 4 || targetStep === 5) {
      setView('gallery');
    }
    setStep(targetStep);
    setMaxReachedStep(prev => Math.max(prev, targetStep));

    // Sync step to multiplayer server if in multiplayer mode
    if (lobbyMode === 'multiplayer' && (roomCode || session?.id)) {
      handleUpdateConfig({ step: targetStep });
    }
  };

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const toggleSound = () => {
    setSoundEnabled(prev => {
      const next = !prev;
      safeLocalStorage.setItem('photobooth_sound_enabled', String(next));
      return next;
    });
  };

  // Camera & Capture states
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [flashActive, setFlashActive] = useState<boolean>(false);

  // Fallback states for camera permission issues or iframe sandbox limits
  const [useUploadFallback, setUseUploadFallback] = useState<boolean>(false);
  const [presets, setPresets] = useState<string[]>([]);
  const [currentUploadPhoto, setCurrentUploadPhoto] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);

  // Generates unique beautiful aesthetic offline preset photos on mount
  const generatePresetPhoto = (emoji: string, bgClass: string, text: string): string => {
    if (typeof document === 'undefined') return '';
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Draw background gradient
      const grad = ctx.createLinearGradient(0, 0, 640, 480);
      if (bgClass === 'peach') {
        grad.addColorStop(0, '#ff9a9e');
        grad.addColorStop(1, '#fecfef');
      } else if (bgClass === 'lilac') {
        grad.addColorStop(0, '#a1c4fd');
        grad.addColorStop(1, '#c2e9fb');
      } else if (bgClass === 'pink') {
        grad.addColorStop(0, '#fbc2eb');
        grad.addColorStop(1, '#a6c1ee');
      } else {
        grad.addColorStop(0, '#fccb90');
        grad.addColorStop(1, '#d57eeb');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 480);
      
      // Draw grid pattern for retro aesthetic
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 640; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 480);
        ctx.stroke();
      }
      for (let j = 0; j < 480; j += 40) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(640, j);
        ctx.stroke();
      }

      // Draw shiny star elements
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '24px serif';
      ctx.fillText('✨', 80, 100);
      ctx.fillText('✨', 540, 380);
      ctx.fillText('⭐', 500, 120);
      ctx.fillText('⭐', 120, 360);

      // Draw Emoji
      ctx.font = '120px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, 320, 210);

      // Draw label banner
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.roundRect(160, 320, 320, 50, 12);
      ctx.fill();

      // Draw text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(text, 320, 345);
    }
    return canvas.toDataURL('image/jpeg');
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        const p1 = generatePresetPhoto('🐱', 'peach', 'POSE 1: SILLY CAT SMILE');
        const p2 = generatePresetPhoto('😎', 'lilac', 'POSE 2: COOL RETRO VIBES');
        const p3 = generatePresetPhoto('💖', 'pink', 'POSE 3: SWEET SPARKLES');
        const p4 = generatePresetPhoto('✌️', 'purple', 'POSE 4: PEACE & LOVE');
        setPresets([p1, p2, p3, p4]);
        setCurrentUploadPhoto(p1);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);
  
  // Live Pre-shot Burst Buffer
  // Saves 12 frames (120ms apart) leading up to each shot
  const burstBuffer = useRef<string[]>([]);
  const burstInterval = useRef<NodeJS.Timeout | null>(null);

  // Gallery Export elements
  const [final2RUrl, setFinal2RUrl] = useState<string>('');
  const [final4RUrl, setFinal4RUrl] = useState<string>('');
  const [gifUrl, setGifUrl] = useState<string>('');
  const [gifLoading, setGifLoading] = useState<boolean>(false);
  const [hoveredPhotoIndex, setHoveredPhotoIndex] = useState<number | null>(null);
  const [livePlaybackIndex, setLivePlaybackIndex] = useState<number | null>(null);
  const [liveFrameIndex, setLiveFrameIndex] = useState<number>(0);
  const liveAnimInterval = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoShootTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [liveGifLoading, setLiveGifLoading] = useState<Record<number, boolean>>({});

  // AI Meme Grader states
  const [aiJudgeResult, setAiJudgeResult] = useState<{ score: number; roast: string; analysis: string } | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // HTML Element References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Callback ref to bind camera streams instantly on component mount/remount
  const setVideoRef = (el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && streamRef.current) {
      el.srcObject = streamRef.current;
      el.play().catch(e => console.warn('Play video on mount error:', e));
    }
  };

  // Synchronization refs to avoid stale closure bugs in timers/callbacks
  const lobbyModeRef = useRef(lobbyMode);
  const soloSessionRef = useRef(soloSession);
  const sessionRef = useRef(session);
  const playerIdRef = useRef(playerId);
  const playerNameRef = useRef(playerName);
  const roomCodeRef = useRef(roomCode);
  const isCapturingRef = useRef(isCapturing);
  const cameraActiveRef = useRef(cameraActive);
  const isUploadingRef = useRef(isUploading);

  useEffect(() => {
    lobbyModeRef.current = lobbyMode;
  }, [lobbyMode]);

  useEffect(() => {
    soloSessionRef.current = soloSession;
  }, [soloSession]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    playerIdRef.current = playerId;
  }, [playerId]);

  useEffect(() => {
    playerNameRef.current = playerName;
  }, [playerName]);

  useEffect(() => {
    roomCodeRef.current = roomCode;
  }, [roomCode]);

  useEffect(() => {
    isCapturingRef.current = isCapturing;
  }, [isCapturing]);

  useEffect(() => {
    isUploadingRef.current = isUploading;
  }, [isUploading]);

  useEffect(() => {
    cameraActiveRef.current = cameraActive;
  }, [cameraActive]);

  // Initialize Player ID & Check URL Join Param
  useEffect(() => {
    const timer = setTimeout(() => {
      let id = safeLocalStorage.getItem('photobooth_player_id');
      if (!id) {
        id = 'player_' + Math.random().toString(36).substring(2, 11);
        safeLocalStorage.setItem('photobooth_player_id', id);
      }
      setPlayerId(id);

      const savedName = safeLocalStorage.getItem('photobooth_player_name') || `User-${id.slice(-4)}`;
      setPlayerName(savedName);

      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const joinCode = params.get('join');
        if (joinCode) {
          const formattedCode = joinCode.trim().toUpperCase();
          setRoomIdInput(formattedCode);
          setLobbyMode('multiplayer');
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Sync player info to localStorage
  const handleUpdateName = (val: string) => {
    setPlayerName(val);
    safeLocalStorage.setItem('photobooth_player_name', val);
  };

  // Web Audio Synthesizer: Sound Effects
  const playShutterSound = () => {
    if (!soundEnabledRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      
      // 1. White Noise burst (shutter snap)
      const bufferSize = audioCtx.sampleRate * 0.15; // 150ms
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // eslint-disable-next-line react-hooks/purity
        data[i] = Math.random() * 2 - 1;
      }
      const noiseNode = audioCtx.createBufferSource();
      noiseNode.buffer = buffer;

      // Noise filter
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, audioCtx.currentTime);
      filter.Q.setValueAtTime(1, audioCtx.currentTime);

      // Noise envelope
      const noiseGain = audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.6, audioCtx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);

      noiseNode.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(audioCtx.destination);

      // 2. High beep (shutter focus lock sound)
      const osc = audioCtx.createOscillator();
      const oscGain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
      oscGain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      oscGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);

      osc.connect(oscGain);
      oscGain.connect(audioCtx.destination);

      // Start everything
      noiseNode.start();
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      console.warn('Audio Context failed to play shutter sound:', e);
    }
  };

  // Immediately stop all capture timers, countdowns, and sound ticks
  const stopPhotoShoot = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (autoShootTimeoutRef.current) {
      clearTimeout(autoShootTimeoutRef.current);
      autoShootTimeoutRef.current = null;
    }
    if (burstInterval.current) {
      clearInterval(burstInterval.current);
      burstInterval.current = null;
    }
    isCapturingRef.current = false;
    setIsCapturing(false);
    setCountdown(null);
    setFlashActive(false);

    // Reset local sequence states
    setLocalShootActive(false);
    localShootActiveRef.current = false;
    setLocalPhotoIndex(0);
    localPhotoIndexRef.current = 0;
  };

  // Web Audio Synthesizer: Countdown Tick Sound
  const playCountdownTickSound = (isHigh = false) => {
    if (!soundEnabledRef.current || !isCapturingRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      const freq = isHigh ? 1046.50 : 880; // C6 or A5
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.8, audioCtx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.09);
    } catch (e) {
      console.warn('Audio Context failed to play countdown tick:', e);
    }
  };

  // Web Audio Synthesizer: Session Complete Fanfare
  const playSessionCompleteSound = () => {
    if (!soundEnabledRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const noteDuration = 0.09;

      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'triangle';
        const startTime = audioCtx.currentTime + idx * noteDuration;
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.28);
      });
    } catch (e) {
      console.warn('Audio Context failed to play session complete sound:', e);
    }
  };

  // Camera Management
  const startCamera = async () => {
    try {
      setCameraError('');
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API tidak didukung di browser ini. Jika Anda berada di dalam preview iframe, silakan klik tombol "Buka di Tab Baru" di sudut kanan atas untuk mengaktifkan kamera secara aman.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: 'user' },
        audio: false
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn('Play video error:', e));
      }
      setCameraActive(true);
      setUseUploadFallback(false); // Disable fallback if camera starts successfully
    } catch (err: any) {
      console.error('Camera capture error:', err);
      const errMsg = err.message || err.name || String(err);
      if (errMsg.includes('Permission denied') || errMsg.includes('NotAllowedError') || errMsg.includes('permission')) {
        setCameraError('Izin kamera ditolak. Silakan aktifkan izin kamera Anda di pengaturan browser, atau klik "Buka di Tab Baru" di kanan atas agar lepas dari proteksi iframe sandbox.');
      } else {
        setCameraError(`Kendala kamera: ${errMsg}`);
      }
      setUseUploadFallback(true);
    }
  };

  const stopCamera = () => {
    stopPhotoShoot();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Upload custom photo from device
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCurrentUploadPhoto(event.target.result as string);
          setUseUploadFallback(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Safely bind camera stream to video element when step is 3 or video element mounts
  useEffect(() => {
    if (step === 3) {
      if (!streamRef.current && !useUploadFallback) {
        startCamera();
      } else if (cameraActive && streamRef.current && videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch((err) => {
          console.warn('Gagal memutar video:', err);
        });
      }
    } else {
      if (isCapturingRef.current) {
        stopPhotoShoot();
      }
      if (cameraActiveRef.current) {
        stopCamera();
      }
    }
  }, [step, cameraActive, useUploadFallback]);

  // Real-time Room Syncing using Firestore Real-time Listener and Lightweight Heartbeats
  useEffect(() => {
    if (!roomCode || lobbyMode !== 'multiplayer') return;

    let unsubscribe: () => void;
    let active = true;

    // 1. Initial REST fetch to measure round-trip time and calculate clock offset for accurate visual countdown synchronization
    const measureClockOffset = async () => {
      try {
        const clientSentTime = Date.now();
        const res = await fetch(`/api/session?id=${roomCode}`);
        if (!res.ok) return;
        const clientRecvTime = Date.now();
        const data = await res.json();
        
        if (active && data && data.serverTime) {
          const estimatedClientTime = (clientSentTime + clientRecvTime) / 2;
          const offset = data.serverTime - estimatedClientTime;
          setClockOffset(offset);
          console.log(`Measured server clock offset: ${offset}ms (RTT: ${clientRecvTime - clientSentTime}ms)`);
        }
      } catch (err) {
        console.warn('Failed to measure clock offset:', err);
      }
    };

    measureClockOffset();

    // 2. Real-time Firestore document state listener (push-based, ultra low latency)
    try {
      const docRef = doc(db, 'sessions', roomCode.toUpperCase());
      unsubscribe = onSnapshot(docRef, (snapshot: any) => {
        if (!active) return;
        if (snapshot.exists()) {
          const data = snapshot.data() as Session;
          setSession(data);
          
          // Sync step from server in multiplayer mode
          if (data.step && data.step !== stepRef.current) {
            setStep(data.step as any);
            setMaxReachedStep(prev => Math.max(prev, data.step));
          }

          // Auto-start camera if in booth state and camera is not active
          if (data.status !== 'finished' && view === 'booth' && !cameraActive) {
            startCamera();
          }
        }
      }, (err: any) => {
        console.error('Firestore real-time subscription error:', err);
      });
    } catch (e) {
      console.error('Failed to initialize Firestore listener:', e);
    }

    // 3. Separate lightweight background heartbeat to update player lastSeen on server every 5 seconds
    const heartbeatInterval = setInterval(async () => {
      if (!active) return;
      try {
        await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'heartbeat',
            id: roomCode,
            playerId
          })
        });
      } catch (err) {
        console.warn('Heartbeat update failed:', err);
      }
    }, 5000);

    return () => {
      active = false;
      if (unsubscribe) unsubscribe();
      clearInterval(heartbeatInterval);
    };
  }, [roomCode, lobbyMode, view, cameraActive, playerId]);

  // Capture Live Photo Burst logic
  const startBurstRecording = () => {
    burstBuffer.current = [];
    if (burstInterval.current) clearInterval(burstInterval.current);
 
    burstInterval.current = setInterval(() => {
      if (!videoRef.current || !cameraActiveRef.current) return;
      const canvas = document.createElement('canvas');
      canvas.width = 320; // Compressed frame size for swift upload
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 320, 240);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        burstBuffer.current.push(dataUrl);
        // Cap the buffer at the last 12 frames
        if (burstBuffer.current.length > 12) {
          burstBuffer.current.shift();
        }
      }
    }, 120); // Capture roughly 8 frames per second
  };
 
  const stopBurstRecording = (): string[] => {
    if (burstInterval.current) {
      clearInterval(burstInterval.current);
      burstInterval.current = null;
    }
    return [...burstBuffer.current];
  };
 
  // Start countdown for a single shot within the automated sequence
  const startAutomatedShot = () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (autoShootTimeoutRef.current) clearTimeout(autoShootTimeoutRef.current);

    isCapturingRef.current = true;
    setIsCapturing(true);
    setCountdown(3);
    playCountdownTickSound(false);
    
    startBurstRecording();

    let counter = 3;
    countdownIntervalRef.current = setInterval(() => {
      counter--;
      if (counter > 0) {
        setCountdown(counter);
        playCountdownTickSound(counter === 1);
      } else {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
        setCountdown(null);
        triggerFlashAndCapture();
      }
    }, 1000);
  };

  // Start the entire 4-photo shoot sequence with all user inputs locked
  const startFullPhotoShootSequence = () => {
    stopPhotoShoot();

    setLocalShootActive(true);
    localShootActiveRef.current = true;
    setLocalPhotoIndex(0);
    localPhotoIndexRef.current = 0;

    if (lobbyModeRef.current === 'solo') {
      setSoloSession(prev => ({
        ...prev,
        currentPhotoIndex: 0,
        status: 'taking'
      }));
    } else {
      setSession(prev => prev ? ({
        ...prev,
        currentPhotoIndex: 0,
        status: 'taking'
      }) : null);
    }

    startAutomatedShot();
  };

  // Perform Local Visual Countdown before taking a photo
  const startLocalVisualCountdown = () => {
    if (isCapturingRef.current) return;
    
    // Clear any pending countdowns/timers first
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (autoShootTimeoutRef.current) clearTimeout(autoShootTimeoutRef.current);

    isCapturingRef.current = true;
    setIsCapturing(true);
    setCountdown(3);
    playCountdownTickSound(false);
    
    // Start recording pre-shot burst
    startBurstRecording();

    let counter = 3;
    countdownIntervalRef.current = setInterval(() => {
      if (!isCapturingRef.current) {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
        return;
      }

      counter--;
      if (counter > 0) {
        setCountdown(counter);
        playCountdownTickSound(counter === 1);
      } else {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
        setCountdown(null);
        // Cheese! Flash & capture!
        triggerFlashAndCapture();
      }
    }, 1000);
  };

  // Flash Screen and Capture the Photo
  const triggerFlashAndCapture = async () => {
    if (!isCapturingRef.current) return;

    setFlashActive(true);
    playShutterSound();
    
    setTimeout(() => {
      setFlashActive(false);
    }, 200);

    const currentLobbyMode = lobbyModeRef.current;
    const currentPlayerId = playerIdRef.current;
    const currentPlayerName = playerNameRef.current;
    const currentRoomCode = roomCodeRef.current;
    const currentSoloSession = soloSessionRef.current;
    const currentSession = sessionRef.current;

    const currentIndex = localShootActiveRef.current 
      ? localPhotoIndexRef.current
      : (currentLobbyMode === 'solo' 
          ? currentSoloSession.currentPhotoIndex 
          : (currentSession?.currentPhotoIndex || 0));

    let mainPhotoUrl = '';
    let capturedBurst: string[] = [];

    // 1. Capture the main high-res photo frame from video or fallback
    if (useUploadFallback || !videoRef.current) {
      // Use current uploaded or preset photo
      mainPhotoUrl = currentUploadPhoto || (presets[currentIndex] ? presets[currentIndex] : (presets[0] || ''));
      
      // Generate a simulated burst of 8 frames with a subtle zooming/rotation effect
      capturedBurst = [];
      const burstCanvas = document.createElement('canvas');
      burstCanvas.width = 320;
      burstCanvas.height = 240;
      const bCtx = burstCanvas.getContext('2d');
      if (bCtx && mainPhotoUrl) {
        const imgObj = new Image();
        imgObj.src = mainPhotoUrl;
        
        for (let f = 0; f < 8; f++) {
          bCtx.clearRect(0, 0, 320, 240);
          bCtx.save();
          // Apply gentle zoom (1.0 to 1.08) and rotation (-1deg to +1deg)
          const scale = 1.0 + (f * 0.012);
          const angle = ((f - 4) * 0.3) * Math.PI / 180;
          bCtx.translate(160, 120);
          bCtx.rotate(angle);
          bCtx.scale(scale, scale);
          bCtx.drawImage(imgObj, -160, -120, 320, 240);
          bCtx.restore();
          capturedBurst.push(burstCanvas.toDataURL('image/jpeg', 0.8));
        }
      }
    } else {
      // Standard video capture
      // Grab final burst frames and stop recording
      capturedBurst = stopBurstRecording();

      const video = videoRef.current;
      const vw = video?.videoWidth || 1280;
      const vh = video?.videoHeight || 960;

      // Exact target aspect ratio for photo slot
      // Solo slot ratio = 340 / 250 = 1.36
      // Online 2-Player half-slot ratio = 170 / 250 = 0.68
      const targetRatio = currentLobbyMode === 'multiplayer' ? (170 / 250) : (340 / 250);

      // High resolution export canvas
      const exportH = 1000;
      const exportW = Math.round(exportH * targetRatio);

      const canvas = document.createElement('canvas');
      canvas.width = exportW;
      canvas.height = exportH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        isCapturingRef.current = false;
        setIsCapturing(false);
        return;
      }
      
      if (video) {
        // Perform exact centered object-cover crop matching the viewfinder feed
        const videoRatio = vw / vh;
        let sx = 0, sy = 0, sw = vw, sh = vh;

        if (videoRatio > targetRatio) {
          sw = vh * targetRatio;
          sx = (vw - sw) / 2;
        } else {
          sh = vw / targetRatio;
          sy = (vh - sh) / 2;
        }

        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, exportW, exportH);
      }
      mainPhotoUrl = canvas.toDataURL('image/jpeg', 0.95);
    }
 
    // 2. Upload photo to local or server session using sync refs
    if (currentLobbyMode === 'solo') {
      // Save in local solo session state
      setSoloSession(prev => {
        const updatedPlayers = { ...prev.players };
        if (!updatedPlayers[currentPlayerId]) {
          updatedPlayers[currentPlayerId] = {
            id: currentPlayerId,
            name: currentPlayerName,
            isReady: false,
            active: true,
            photos: {},
            livePhotos: {}
          };
        }
        
        updatedPlayers[currentPlayerId].photos[currentIndex] = mainPhotoUrl;
        updatedPlayers[currentPlayerId].livePhotos[currentIndex] = capturedBurst;

        return {
          ...prev,
          players: updatedPlayers
        };
      });

      if (localShootActiveRef.current) {
        if (currentIndex < 3) {
          autoShootTimeoutRef.current = setTimeout(() => {
            const nextIdx = currentIndex + 1;
            setLocalPhotoIndex(nextIdx);
            localPhotoIndexRef.current = nextIdx;
            
            setSoloSession(prev => ({
              ...prev,
              currentPhotoIndex: nextIdx
            }));

            startAutomatedShot();
          }, 1500);
        } else {
          autoShootTimeoutRef.current = setTimeout(() => {
            stopPhotoShoot();
            setStep(4);
            setView('gallery');
            playSessionCompleteSound();
            stopCamera();
          }, 1500);
        }
      } else {
        // Single retake shot for Solo Mode
        autoShootTimeoutRef.current = setTimeout(() => {
          stopPhotoShoot();
          setStep(4);
          setView('gallery');
          playSessionCompleteSound();
          stopCamera();
        }, 1500);
      }
    } else {
      // Multiplayer Mode
      // Save in local session state OPTIMISTICALLY for instant visual feedback!
      setSession(prev => {
        if (!prev) return prev;
        const updatedPlayers = { ...prev.players };
        if (!updatedPlayers[currentPlayerId]) {
          updatedPlayers[currentPlayerId] = {
            id: currentPlayerId,
            name: currentPlayerName,
            isReady: false,
            active: true,
            photos: {},
            livePhotos: {}
          };
        }
        updatedPlayers[currentPlayerId] = {
          ...updatedPlayers[currentPlayerId],
          photos: {
            ...updatedPlayers[currentPlayerId].photos,
            [currentIndex]: mainPhotoUrl
          },
          livePhotos: {
            ...updatedPlayers[currentPlayerId].livePhotos,
            [currentIndex]: capturedBurst
          }
        };
        return {
          ...prev,
          players: updatedPlayers
        };
      });

      // Background Upload
      setIsUploading(true);
      isUploadingRef.current = true;

      fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upload_photo',
          id: currentRoomCode,
          playerId: currentPlayerId,
          index: currentIndex,
          photo: mainPhotoUrl,
          livePhotos: capturedBurst
        })
      })
      .then(res => res.json())
      .then(updated => {
        setIsUploading(false);
        isUploadingRef.current = false;
        if (updated && !updated.error) {
          setSession(prev => {
            if (!prev) return updated;
            return {
              ...updated,
              players: {
                ...updated.players,
                [currentPlayerId]: {
                  ...updated.players[currentPlayerId],
                  photos: {
                    ...updated.players[currentPlayerId]?.photos,
                    ...prev.players[currentPlayerId]?.photos
                  },
                  livePhotos: {
                    ...updated.players[currentPlayerId]?.livePhotos,
                    ...prev.players[currentPlayerId]?.livePhotos
                  }
                }
              }
            };
          });
        }
      })
      .catch(err => {
        console.error('Photo upload error:', err);
        setIsUploading(false);
        isUploadingRef.current = false;
      });

      if (localShootActiveRef.current) {
        if (currentIndex < 3) {
          autoShootTimeoutRef.current = setTimeout(() => {
            const nextIdx = currentIndex + 1;
            setLocalPhotoIndex(nextIdx);
            localPhotoIndexRef.current = nextIdx;
            
            // Optimistically update currentPhotoIndex
            setSession(prev => prev ? ({
              ...prev,
              currentPhotoIndex: nextIdx
            }) : null);

            startAutomatedShot();
          }, 1500);
        } else {
          autoShootTimeoutRef.current = setTimeout(() => {
            stopPhotoShoot();
            setStep(4);
            setView('gallery');
            playSessionCompleteSound();
            stopCamera();
          }, 1500);
        }
      } else {
        // Single retake shot for Multiplayer
        isCapturingRef.current = false;
        setIsCapturing(false);
      }
    }
  };

  // Auto switch to gallery when multiplayer session is finished
  useEffect(() => {
    if (lobbyMode === 'multiplayer' && session?.status === 'finished' && (view === 'booth' || step === 3)) {
      const timer = setTimeout(() => {
        setStep(4);
        setView('gallery');
        playSessionCompleteSound();
        stopCamera();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [session?.status, view, step, lobbyMode]);

  // Handle Multi-Player Countdown Sync with Clock Drift Adjustment
  useEffect(() => {
    if (lobbyMode !== 'multiplayer' || !session || session.status !== 'countdown' || !session.countdownStartAt) return;

    // If local sequence photoshoot is already active, ignore any incoming server countdown triggers
    if (localShootActiveRef.current) return;

    // eslint-disable-next-line react-hooks/purity
    const remaining = session.countdownStartAt - (Date.now() + clockOffset);
    
    // Set a timeout to trigger synchronized local visual countdown
    const triggerLocalCountdown = setTimeout(() => {
      if (session.currentPhotoIndex === 0) {
        startFullPhotoShootSequence();
      } else {
        startLocalVisualCountdown();
      }
    }, Math.max(0, remaining));

    return () => clearTimeout(triggerLocalCountdown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.status, session?.countdownStartAt, session?.currentPhotoIndex, clockOffset]);

  // Auto-navigate room players to Step 3 when countdown or taking is active
  useEffect(() => {
    if (lobbyMode === 'multiplayer' && session && (session.status === 'countdown' || session.status === 'taking')) {
      if (step !== 3) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setStep(3);
        setView('booth');
        startCamera();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.status, lobbyMode, step]);

  // Retake a specific photo frame index
  const handleRetakeSinglePhoto = async (index: number) => {
    stopPhotoShoot();
    if (lobbyMode === 'solo') {
      setSoloSession(prev => {
        const updatedPlayers = { ...prev.players };
        if (updatedPlayers[playerId]) {
          delete updatedPlayers[playerId].photos[index];
          delete updatedPlayers[playerId].livePhotos[index];
        }
        return {
          ...prev,
          currentPhotoIndex: index,
          status: 'taking',
          players: updatedPlayers
        };
      });
      setStep(3);
      setView('booth');
      startCamera();
    } else if (roomCode) {
      try {
        const res = await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'retake_photo',
            id: roomCode,
            index
          })
        });
        const updated = await res.json();
        if (!updated.error) {
          setSession(updated);
          setStep(3);
          setView('booth');
          startCamera();
        }
      } catch (err) {
        console.error('Error retaking single photo:', err);
      }
    }
  };

  // Reset/retake all 4 photos from start
  const handleRetakeAllPhotos = async () => {
    stopPhotoShoot();
    if (lobbyMode === 'solo') {
      setSoloSession(prev => {
        const updatedPlayers = { ...prev.players };
        if (updatedPlayers[playerId]) {
          updatedPlayers[playerId].photos = {};
          updatedPlayers[playerId].livePhotos = {};
        }
        return {
          ...prev,
          currentPhotoIndex: 0,
          status: 'taking',
          players: updatedPlayers
        };
      });
      setStep(3);
      setView('booth');
      startCamera();
    } else if (roomCode) {
      try {
        const res = await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'reset',
            id: roomCode
          })
        });
        const updated = await res.json();
        if (!updated.error) {
          setSession(updated);
          setStep(3);
          setView('booth');
          startCamera();
        }
      } catch (err) {
        console.error('Error retaking all photos:', err);
      }
    }
  };

  // Sync Layout Options to Multiplayer server & optimistic local state
  const handleUpdateConfig = async (configUpdate: { mode?: 'freestyle' | 'meme', memeId?: string, overlayId?: string, filterId?: string, step?: number }) => {
    // 1. Immediate optimistic local update for responsive UI feedback
    setSoloSession(prev => ({
      ...prev,
      ...configUpdate
    }));
    setSession(prev => prev ? ({
      ...prev,
      ...configUpdate
    }) : prev);

    // 2. Sync to online room server if in multiplayer mode
    const targetCode = roomCode || session?.id;
    if (lobbyMode === 'multiplayer' && targetCode) {
      try {
        const res = await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_config',
            id: targetCode,
            ...configUpdate
          })
        });
        const updated = await res.json();
        if (!updated.error) setSession(updated);
      } catch (err) {
        console.error('Failed to sync online config:', err);
      }
    }
  };

  // Toggle Multiplayer Ready State
  // Join/Ready Multiplayer toggle
  const handleToggleReady = async () => {
    const targetId = roomCode || session?.id;
    if (!targetId) {
      console.error('Cannot toggle ready: No Room ID found.');
      return;
    }
    
    const isCurrentlyReady = session?.players[playerId]?.isReady || false;
    const nextReadyState = !isCurrentlyReady;

    // Optimistic local state update to ensure 100% instant visual sync
    setSession(prev => {
      if (!prev) return prev;
      const updatedPlayers = { ...prev.players };
      if (updatedPlayers[playerId]) {
        updatedPlayers[playerId] = {
          ...updatedPlayers[playerId],
          isReady: nextReadyState
        };
      }
      return {
        ...prev,
        players: updatedPlayers
      };
    });

    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ready',
          id: targetId,
          playerId,
          isReady: nextReadyState
        })
      });
      const updated = await res.json();
      if (updated.error) {
        alert(`Gagal: ${updated.error}`);
        // Revert optimistic update
        setSession(prev => {
          if (!prev) return prev;
          const updatedPlayers = { ...prev.players };
          if (updatedPlayers[playerId]) {
            updatedPlayers[playerId] = {
              ...updatedPlayers[playerId],
              isReady: isCurrentlyReady
            };
          }
          return {
            ...prev,
            players: updatedPlayers
          };
        });
      } else {
        setSession(updated);
      }
    } catch (err) {
      console.error('Toggle Ready Error:', err);
      alert('Gagal menghubungi server untuk mengubah status siap.');
      // Revert optimistic update
      setSession(prev => {
        if (!prev) return prev;
        const updatedPlayers = { ...prev.players };
        if (updatedPlayers[playerId]) {
          updatedPlayers[playerId] = {
            ...updatedPlayers[playerId],
            isReady: isCurrentlyReady
          };
        }
        return {
          ...prev,
          players: updatedPlayers
        };
      });
    }
  };

  // Create real-time Multiplayer Room
  const handleCreateRoom = async () => {
    let activePlayerId = playerId;
    if (!activePlayerId) {
      activePlayerId = 'player_' + Math.random().toString(36).substring(2, 11);
      setPlayerId(activePlayerId);
      safeLocalStorage.setItem('photobooth_player_id', activePlayerId);
    }

    let activePlayerName = playerName;
    if (!activePlayerName) {
      activePlayerName = `User-${activePlayerId.slice(-4)}`;
      setPlayerName(activePlayerName);
      safeLocalStorage.setItem('photobooth_player_name', activePlayerName);
    }

    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          creatorName: activePlayerName,
          creatorId: activePlayerId
        })
      });
      const data = await res.json();
      if (data.error) {
        alert(`Gagal membuat room: ${data.error}`);
      } else {
        setLobbyMode('multiplayer');
        setRoomCode(data.id);
        setSession(data);
        setStep(2);
      }
    } catch (err) {
      console.error(err);
      alert('Gagal membuat room. Hubungan internet terputus.');
    }
  };

  // Join real-time Multiplayer Room
  const handleJoinRoom = async (codeOverride?: string | React.MouseEvent) => {
    const rawCode = (typeof codeOverride === 'string' ? codeOverride : roomIdInput) || '';
    const code = rawCode.trim().toUpperCase();
    if (!code) {
      alert('Masukkan Kode Room 4 karakter untuk bergabung.');
      return;
    }

    let activePlayerId = playerId;
    if (!activePlayerId) {
      activePlayerId = 'player_' + Math.random().toString(36).substring(2, 11);
      setPlayerId(activePlayerId);
      safeLocalStorage.setItem('photobooth_player_id', activePlayerId);
    }

    let activePlayerName = playerName;
    if (!activePlayerName) {
      activePlayerName = `User-${activePlayerId.slice(-4)}`;
      setPlayerName(activePlayerName);
      safeLocalStorage.setItem('photobooth_player_name', activePlayerName);
    }

    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join',
          id: code,
          playerName: activePlayerName,
          playerId: activePlayerId
        })
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setLobbyMode('multiplayer');
        setRoomCode(data.id);
        setSession(data);
        setStep(2);
        // Clear join param from URL
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    } catch (err) {
      console.error(err);
      alert('Gagal terhubung ke server room.');
    }
  };

  // Copy Room Link to clipboard
  const handleCopyLink = () => {
    const link = `${window.location.origin}/?join=${roomCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Call Gemini AI pose judge
  const triggerAiJudge = async (base64Image: string, memeId: string) => {
    setAiLoading(true);
    setAiJudgeResult(null);
    try {
      const res = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userImage: base64Image, memeId })
      });
      const data = await res.json();
      setAiJudgeResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  // Render & Compile final download links
  useEffect(() => {
    if (step !== 2 && step !== 4 && step !== 5 && view !== 'gallery') return;

    const compileImages = async () => {
      const activeSession = lobbyMode === 'solo' ? soloSession : session;
      if (!activeSession) return;

      const playerIds = Object.keys(activeSession.players);
      const isSoloGame = lobbyMode === 'solo' || playerIds.length < 2;

      // Deterministic player ordering: Host (creator) is always p1, guest is always p2
      const creatorId = activeSession.creatorId;
      const p1 = (creatorId && activeSession.players[creatorId]) 
        ? activeSession.players[creatorId] 
        : activeSession.players[playerIds[0]];
      
      const partnerId = creatorId ? playerIds.find(id => id !== creatorId) : playerIds[1];
      const p2 = isSoloGame ? null : (partnerId ? activeSession.players[partnerId] : null);

      const photos1 = p1 ? [0, 1, 2, 3].map(i => p1.photos[i] || '') : [];
      const photos2 = p2 ? [0, 1, 2, 3].map(i => p2.photos[i] || '') : [];

      const names = [p1?.name || 'Player 1'];
      if (p2) names.push(p2.name);

      const drawOpts = {
        photos: photos1,
        photos2: p2 ? photos2 : undefined,
        overlayId: activeSession.overlayId,
        filterId: activeSession.filterId,
        playerNames: names,
        roomCode: activeSession.id
      };

      try {
        const canvas2R = await draw2RStrip(drawOpts);
        setFinal2RUrl(canvas2R.toDataURL('image/png'));

        const canvas4R = await draw4RLayout(drawOpts);
        setFinal4RUrl(canvas4R.toDataURL('image/png'));

        // Generate Animated GIF dynamically via gifshot only when valid photos exist
        const validFrames = photos1.filter(p => typeof p === 'string' && p.startsWith('data:image'));
        
        if (validFrames.length > 0) {
          setGifLoading(true);
          const gifshotModule = (await import('gifshot')).default;
          gifshotModule.createGIF({
            images: validFrames,
            gifWidth: 400,
            gifHeight: 300,
            interval: 0.4,
            numFrames: validFrames.length,
          }, (obj: any) => {
            setGifLoading(false);
            if (!obj.error) {
              setGifUrl(obj.image);
            } else {
              console.error('GIF generation error:', obj.error);
              setGifUrl('');
            }
          });
        } else {
          setGifLoading(false);
          setGifUrl('');
        }

        // Trigger AI grading if in Meme Mode and photo 1 is taken
        if (activeSession.mode === 'meme' && photos1.length > 0) {
          triggerAiJudge(photos1[0], activeSession.memeId);
        }
      } catch (err) {
        console.error('Error drawing layouts:', err);
      }
    };

    compileImages();
  }, [view, session, soloSession, lobbyMode, step]);

  // Live Photo Burst hover loop player
  const startLivePhotoPlayback = (idx: number) => {
    const activeSession = lobbyMode === 'solo' ? soloSession : session;
    if (!activeSession) return;

    const p = Object.values(activeSession.players)[0]; // P1
    const burst = p?.livePhotos?.[idx];
    
    if (!burst || burst.length === 0) return;

    setLivePlaybackIndex(idx);
    setLiveFrameIndex(0);

    if (liveAnimInterval.current) clearInterval(liveAnimInterval.current);

    let currentFrame = 0;
    liveAnimInterval.current = setInterval(() => {
      currentFrame = (currentFrame + 1) % burst.length;
      setLiveFrameIndex(currentFrame);
    }, 110);
  };

  const stopLivePhotoPlayback = () => {
    if (liveAnimInterval.current) {
      clearInterval(liveAnimInterval.current);
      liveAnimInterval.current = null;
    }
    setLivePlaybackIndex(null);
  };

  const downloadLivePhoto = async (idx: number) => {
    const activeSession = lobbyMode === 'solo' ? soloSession : session;
    if (!activeSession) return;

    const playerIds = Object.keys(activeSession.players);
    // Deterministic player ordering: Host (creator) is always p1, guest is always p2
    const creatorId = activeSession.creatorId;
    const p1 = (creatorId && activeSession.players[creatorId]) 
      ? activeSession.players[creatorId] 
      : activeSession.players[playerIds[0]];
    
    const partnerId = creatorId ? playerIds.find(id => id !== creatorId) : playerIds[1];
    const p2 = playerIds.length > 1 ? (partnerId ? activeSession.players[partnerId] : null) : null;

    const burst1 = p1?.livePhotos?.[idx];
    const burst2 = p2?.livePhotos?.[idx];

    if ((!burst1 || burst1.length === 0) && (!burst2 || burst2.length === 0)) {
      alert('Tidak ada file burst Live Photo untuk shot ini.');
      return;
    }

    setLiveGifLoading(prev => ({ ...prev, [idx]: true }));

    try {
      const gifshotModule = (await import('gifshot')).default;

      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = (e) => reject(e);
          img.src = src;
        });
      };

      let compiledFrames: string[] = [];

      // If we have both players' bursts, draw them side-by-side
      if (burst1 && burst1.length > 0 && burst2 && burst2.length > 0) {
        const frameCount = Math.min(burst1.length, burst2.length);
        const canvas = document.createElement('canvas');
        canvas.width = 640; // 320 * 2
        canvas.height = 240;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          for (let f = 0; f < frameCount; f++) {
            try {
              const img1 = await loadImage(burst1[f]);
              const img2 = await loadImage(burst2[f]);

              ctx.clearRect(0, 0, 640, 240);

              // Draw P1 (left) with mirroring
              ctx.save();
              ctx.translate(320, 0);
              ctx.scale(-1, 1);
              ctx.drawImage(img1, 0, 0, 320, 240);
              ctx.restore();

              // Draw P2 (right) with mirroring
              ctx.save();
              ctx.translate(640, 0);
              ctx.scale(-1, 1);
              ctx.drawImage(img2, -320, 0, 320, 240);
              ctx.restore();

              compiledFrames.push(canvas.toDataURL('image/jpeg', 0.85));
            } catch (err) {
              console.error('Frame compile error at frame', f, err);
            }
          }
        }
      } else {
        // Only one player's burst (or fallback to whoever has it)
        const activeBurst = (burst1 && burst1.length > 0) ? burst1 : burst2;
        if (activeBurst) {
          const canvas = document.createElement('canvas');
          canvas.width = 320;
          canvas.height = 240;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            for (let f = 0; f < activeBurst.length; f++) {
              try {
                const imgObj = await loadImage(activeBurst[f]);
                ctx.clearRect(0, 0, 320, 240);
                // Draw with mirroring
                ctx.save();
                ctx.translate(320, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(imgObj, 0, 0, 320, 240);
                ctx.restore();
                compiledFrames.push(canvas.toDataURL('image/jpeg', 0.85));
              } catch (err) {
                console.error(err);
              }
            }
          }
        }
      }

      if (compiledFrames.length === 0) {
        throw new Error('Gagal memproses frame Live Photo.');
      }

      gifshotModule.createGIF({
        images: compiledFrames,
        gifWidth: compiledFrames.length > 0 && burst1 && burst2 ? 640 : 320,
        gifHeight: 240,
        interval: 0.12,
        numFrames: compiledFrames.length,
      }, (obj: any) => {
        setLiveGifLoading(prev => ({ ...prev, [idx]: false }));
        if (!obj.error) {
          const link = document.createElement('a');
          link.href = obj.image;
          link.download = `Photobooth_LivePhoto_Shot_${idx + 1}_${roomCode || 'Solo'}.gif`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          console.error('Error compiling Live Photo GIF:', obj.error);
          alert('Gagal menyusun GIF Live Photo.');
        }
      });
    } catch (err) {
      console.error(err);
      setLiveGifLoading(prev => ({ ...prev, [idx]: false }));
      alert('Terjadi kesalahan saat mengunduh Live Photo.');
    }
  };

  // Retake individual shot frame
  const handleRetakePhoto = async (idx: number) => {
    isCapturingRef.current = false;
    setIsCapturing(false);
    setCountdown(null);

    if (lobbyMode === 'solo') {
      setSoloSession(prev => {
        const updatedPlayers = { ...prev.players };
        if (updatedPlayers[playerId]) {
          delete updatedPlayers[playerId].photos[idx];
          delete updatedPlayers[playerId].livePhotos[idx];
        }
        return {
          ...prev,
          currentPhotoIndex: idx,
          status: 'countdown',
          players: updatedPlayers
        };
      });

      setView('booth');
      if (!useUploadFallback && !cameraActive) {
        startCamera();
      }

      setTimeout(() => {
        isCapturingRef.current = false;
        setIsCapturing(false);
        startLocalVisualCountdown();
      }, 500);
    } else {
      try {
        const res = await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'retake_photo',
            id: roomCode,
            index: idx
          })
        });
        const updated = await res.json();
        if (!updated.error) {
          setSession(updated);
          setView('booth');
          if (!useUploadFallback && !cameraActive) {
            startCamera();
          }
        }
      } catch (err) {
        console.error('Error retaking photo:', err);
      }
    }
  };

  // Share photo using Web Share API or direct share link fallback
  const handleSharePhoto = async (dataUrl: string, title: string, filename: string) => {
    if (!dataUrl) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], filename, { type: blob.type || 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: title,
            text: 'Lihat hasil foto photobooth kami!',
            files: [file]
          });
          return;
        } else {
          await navigator.share({
            title: title,
            text: 'Lihat hasil foto photobooth kami!',
            url: window.location.href
          });
          return;
        }
      }
      // Fallback to WhatsApp share
      const text = encodeURIComponent('Lihat hasil foto photobooth kami! ' + window.location.href);
      window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.log('Share dismissed or failed:', err);
      }
    }
  };

  // Reset Session to start over
  const handleReset = async () => {
    stopCamera();
    setFinal2RUrl('');
    setFinal4RUrl('');
    setGifUrl('');
    setAiJudgeResult(null);

    if (lobbyMode === 'solo') {
      setSoloSession({
        id: '',
        status: 'waiting',
        step: 1,
        creatorId: '',
        mode: 'freestyle',
        memeId: 'pikachu',
        overlayId: 'classic-white',
        filterId: 'none',
        currentPhotoIndex: 0,
        players: {}
      });
      setView('booth');
      startCamera();
    } else {
      try {
        await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'reset',
            id: roomCode
          })
        });
        setView('booth');
        startCamera();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Exit game to lobby
  const handleExitToLobby = () => {
    stopCamera();
    setView('lobby');
    setRoomCode('');
    setSession(null);
    setStep(1);
  };

  // Active Session and configuration pointer helper
  const activeConfig = lobbyMode === 'solo' ? soloSession : (session || soloSession);
  const playersArray = Object.values(activeConfig.players);
  const activePhotosCount = playersArray[0] ? Object.keys(playersArray[0].photos).length : 0;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-50 via-white to-pink-100/50 text-slate-800 font-sans select-none">
      
      {/* 1. Fixed Header Bar */}
      <header className="sticky top-0 z-40 h-14 flex-shrink-0 bg-white/90 backdrop-blur-md border-b border-pink-100 px-4 md:px-6 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={handleExitToLobby}>
          <div className="w-8 h-8 rounded-xl bg-pink-500 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-pink-200">
            <Camera className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="font-extrabold tracking-tight text-base text-pink-600 uppercase">Photobooth Abuy</span>
            <span className="text-xs text-pink-400 font-medium hidden sm:inline-block">• Dibuat untuk Ghina dari Aghna</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={toggleSound}
            className="p-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-600 border border-pink-100 transition-colors"
            title={soundEnabled ? 'Mute Suara' : 'Aktifkan Suara'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {playerName && (
            <div className="flex items-center space-x-2 bg-pink-50 px-3 py-1 rounded-full text-xs font-mono text-pink-700 border border-pink-200">
              <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-pulse" />
              <span>{playerName}</span>
            </div>
          )}
        </div>
      </header>

      {/* 2. Step Stepper Bar */}
      <nav className="sticky top-14 z-30 h-10 flex-shrink-0 bg-pink-50/90 backdrop-blur-md border-b border-pink-100 flex items-center justify-center px-2 w-full overflow-hidden">
        <div className="flex items-center justify-between w-full max-w-md text-[10px] sm:text-xs font-medium">
          {[
            { id: 1, label: 'Profil' },
            { id: 2, label: 'Frame' },
            { id: 3, label: 'Foto' },
            { id: 4, label: 'Filter' },
            { id: 5, label: 'Ekspor' }
          ].map((item, idx) => (
            <React.Fragment key={item.id}>
              {idx > 0 && <span className="text-pink-200 text-[10px] select-none">/</span>}
              <button
                type="button"
                disabled={item.id > Math.max(step, maxReachedStep)}
                onClick={() => goToStep(item.id as 1 | 2 | 3 | 4 | 5)}
                className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full transition-all whitespace-nowrap text-center ${
                  step === item.id
                    ? 'bg-pink-500 text-white font-bold shadow-xs shadow-pink-200'
                    : item.id <= maxReachedStep
                    ? 'text-pink-800 hover:text-pink-900 hover:bg-pink-100/70 font-semibold'
                    : 'text-pink-300 cursor-not-allowed opacity-50'
                }`}
              >
                {item.id}. {item.label}
              </button>
            </React.Fragment>
          ))}
        </div>
      </nav>

      {/* 3. Main Dynamic Step Body */}
      <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 w-full max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: PROFIL & MODE */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-lg bg-white border border-pink-100 rounded-3xl p-6 shadow-xl shadow-pink-100/40 space-y-5 my-auto"
            >
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-800 mb-1">
                  Atur Nama Pengguna & Mode
                </h2>
                <p className="text-xs text-slate-500">
                  Masukkan nama kamu untuk memulai studio photobooth.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-pink-600 uppercase">Nama Pengguna</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => handleUpdateName(e.target.value)}
                  maxLength={15}
                  placeholder="Contoh: Ghina"
                  className="w-full px-4 py-2.5 bg-pink-50/40 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm text-slate-800 font-medium placeholder-slate-400"
                />
              </div>

              {/* Mode Selection */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-pink-600 uppercase">Pilih Mode Studio</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLobbyMode('solo')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition-all whitespace-nowrap ${
                      lobbyMode === 'solo'
                        ? 'bg-pink-500 text-white border-pink-500 shadow-xs shadow-pink-200 font-bold'
                        : 'bg-pink-50/50 border-pink-200 text-slate-600 hover:bg-pink-100/50'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>Solo Booth</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLobbyMode('multiplayer')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition-all whitespace-nowrap ${
                      lobbyMode === 'multiplayer'
                        ? 'bg-pink-500 text-white border-pink-500 shadow-xs shadow-pink-200 font-bold'
                        : 'bg-pink-50/50 border-pink-200 text-slate-600 hover:bg-pink-100/50'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Online 2 Orang</span>
                  </button>
                </div>
              </div>

              {/* Mode Details & Navigation */}
              {lobbyMode === 'solo' ? (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    className="w-full py-2.5 px-4 bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-xs shadow-pink-200 transition-all whitespace-nowrap"
                  >
                    <span>Lanjut Pilih Frame</span>
                    <ChevronRight className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleCreateRoom}
                    className="w-full py-2.5 px-4 bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-xs shadow-pink-200 transition-all whitespace-nowrap"
                  >
                    <Users className="w-4 h-4" />
                    <span>Buat Room Online Baru</span>
                  </button>

                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="text"
                      value={roomIdInput}
                      onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                      maxLength={4}
                      placeholder="KODE ROOM"
                      className="flex-1 px-3 py-2 bg-pink-50/40 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 text-center text-xs font-mono font-bold uppercase text-slate-800 tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={() => handleJoinRoom()}
                      className="px-4 py-2 bg-pink-100 hover:bg-pink-200 text-pink-700 text-xs font-bold rounded-xl transition-all border border-pink-200 whitespace-nowrap"
                    >
                      Gabung Room
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 2: PILIH FRAME (SEBELUM FOTO) */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full max-w-4xl bg-white border border-pink-100 rounded-3xl p-5 sm:p-6 shadow-xl shadow-pink-100/40 flex flex-col lg:flex-row gap-6 my-auto"
            >
              {/* Left Column: Visual Frame Preview */}
              <div className="lg:w-1/2 flex flex-col items-center justify-center bg-pink-50/40 p-4 rounded-2xl border border-pink-100">
                <p className="text-[11px] font-mono font-bold text-pink-600 uppercase mb-3">Preview Frame Strip</p>
                
                {/* Simulated 2R Strip Box */}
                <div 
                  className="w-36 p-2 rounded-xl shadow-lg flex flex-col items-center space-y-1.5 transition-colors duration-300 border border-pink-100"
                  style={{ backgroundColor: OVERLAYS.find(o => o.id === activeConfig.overlayId)?.bg || '#ffffff' }}
                >
                  <p 
                    className="text-[9px] font-bold uppercase tracking-wider text-center"
                    style={{ color: OVERLAYS.find(o => o.id === activeConfig.overlayId)?.text || '#1e293b' }}
                  >
                    Photobooth Abuy
                  </p>
                  
                  {[0, 1, 2, 3].map((idx) => (
                    <div key={idx} className="w-full h-16 bg-pink-100/30 rounded-lg flex items-center justify-center border border-pink-200/40">
                      <Camera className="w-4 h-4 text-pink-400" />
                    </div>
                  ))}

                  <p 
                    className="text-[8px] font-medium text-center opacity-80"
                    style={{ color: OVERLAYS.find(o => o.id === activeConfig.overlayId)?.text || '#1e293b' }}
                  >
                    Dibuat untuk Ghina dari Aghna
                  </p>
                </div>
              </div>

              {/* Right Column: Frame Controls */}
              <div className="lg:w-1/2 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="text-base font-bold text-slate-800">Pilih Warna Frame</h3>
                    {lobbyMode === 'multiplayer' && (
                      <span className="px-2 py-0.5 bg-pink-100 text-pink-700 text-[10px] font-bold rounded-full border border-pink-200 uppercase">
                        Berbagi Frame
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mb-3">Pilih tema warna bingkai foto aesthetic sebelum mengambil gambar.</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                    {OVERLAYS.map((overlay) => (
                      <button
                        key={overlay.id}
                        type="button"
                        onClick={() => handleUpdateConfig({ overlayId: overlay.id })}
                        className={`py-2 px-3 rounded-xl border text-left transition-all flex items-center justify-between whitespace-nowrap ${
                          activeConfig.overlayId === overlay.id
                            ? 'ring-2 ring-pink-500 border-pink-400 shadow-xs font-bold'
                            : 'border-pink-100 hover:border-pink-300'
                        }`}
                        style={{ backgroundColor: overlay.bg }}
                      >
                        <span className="text-xs font-bold truncate" style={{ color: overlay.text }}>{overlay.name}</span>
                        {activeConfig.overlayId === overlay.id && (
                          <Check className="w-3.5 h-3.5 flex-shrink-0 ml-1" style={{ color: overlay.text }} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step Actions */}
                <div className="flex flex-col space-y-2 pt-2 border-t border-pink-100">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => goToStep(1)}
                      className="flex-1 py-2.5 px-3 bg-pink-50 hover:bg-pink-100 text-pink-700 font-semibold text-xs rounded-xl flex items-center justify-center space-x-1 border border-pink-200 transition-all whitespace-nowrap"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Kembali</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => goToStep(3)}
                      className="flex-1 py-2.5 px-3 bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1 transition-all shadow-md shadow-pink-200 whitespace-nowrap"
                    >
                      <span>Masuk Studio Foto</span>
                      <ChevronRight className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: STUDIO FOTO (BOOTH CAPTURE) */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-2xl bg-white border border-pink-100 rounded-3xl p-4 sm:p-5 shadow-xl shadow-pink-100/40 flex flex-col items-center space-y-3.5 my-auto"
            >
              {/* Top Booth Status */}
              <div className="w-full flex items-center justify-between text-xs font-medium text-slate-600 px-1">
                <span className="font-bold text-pink-600">Sesi Foto Ke-{((activeConfig.currentPhotoIndex || 0) + 1)} / 4</span>
                <span className="font-mono text-[11px] bg-pink-50 text-pink-700 px-2.5 py-0.5 rounded-full border border-pink-200">
                  Frame: {OVERLAYS.find(o => o.id === activeConfig.overlayId)?.name}
                </span>
              </div>

              {/* Viewfinder Camera Feed - Natural 4:3 Aspect Ratio for clean preview without eating vertical height */}
              <div className="relative w-full max-w-md mx-auto aspect-[4/3] bg-pink-950/20 rounded-2xl overflow-hidden border-2 border-pink-200 flex items-center justify-center shadow-inner transition-all">
                
                {/* Camera Error / Permission Denied Message */}
                {cameraError ? (
                  <div className="p-4 text-center max-w-md space-y-3 bg-white/95 backdrop-blur rounded-2xl p-5 border border-pink-200 shadow-md">
                    <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center mx-auto text-pink-500">
                      <CameraOff className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-800 font-bold mb-1">Akses Kamera Dibatasi / Ditolak</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{cameraError}</p>
                    </div>

                    {/* File Upload & Preset Options */}
                    <div className="pt-2 border-t border-pink-100 space-y-2">
                      <label className="w-full py-2.5 px-3 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-pink-200 flex items-center justify-center space-x-2 cursor-pointer min-h-[40px]">
                        <Upload className="w-4 h-4" />
                        <span>Upload Foto dari Perangkat / HP</span>
                        <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                      </label>

                      <div className="flex justify-center space-x-1.5 pt-1">
                        {presets.map((preset, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => {
                              setCurrentUploadPhoto(preset);
                              setUseUploadFallback(true);
                              setCameraError('');
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                              currentUploadPhoto === preset && useUploadFallback
                                ? 'bg-pink-500 text-white border-pink-500 shadow-xs'
                                : 'bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100'
                            }`}
                          >
                            Preset {pIdx + 1}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setCameraError('');
                          setUseUploadFallback(false);
                          startCamera();
                        }}
                        className="text-[11px] text-pink-600 underline hover:text-pink-700 font-medium block mx-auto pt-1"
                      >
                        Coba Aktifkan Kamera Kembali
                      </button>
                    </div>
                  </div>
                ) : useUploadFallback ? (
                  <div className="p-4 text-center space-y-3 bg-white/90 rounded-2xl border border-pink-100 p-5">
                    <p className="text-xs text-slate-800 font-bold">Pilih Foto dari Perangkat atau Preset:</p>
                    <div className="flex flex-wrap justify-center items-center gap-2">
                      <label className="px-3.5 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-pink-200 cursor-pointer flex items-center space-x-1.5 min-h-[38px]">
                        <Upload className="w-4 h-4" />
                        <span>Upload Foto Kamu</span>
                        <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                      </label>

                      {presets.map((preset, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => setCurrentUploadPhoto(preset)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all min-h-[38px] ${
                            currentUploadPhoto === preset
                              ? 'bg-pink-500 text-white border-pink-500 shadow-md'
                              : 'bg-white border-pink-200 text-slate-600 hover:bg-pink-50'
                          }`}
                        >
                          Preset {pIdx + 1}
                        </button>
                      ))}
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => { setUseUploadFallback(false); startCamera(); }}
                        className="text-[11px] text-pink-600 underline hover:text-pink-700 font-medium"
                      >
                        Coba Aktifkan Kamera Kembali
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {!cameraActive && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-pink-50/90 text-pink-600 space-y-2 z-10">
                        <RefreshCw className="w-6 h-6 animate-spin text-pink-500" />
                        <span className="text-xs font-medium">Menghubungkan Kamera...</span>
                        <button
                          type="button"
                          onClick={() => setUseUploadFallback(true)}
                          className="mt-2 px-3 py-1 bg-white border border-pink-200 text-[11px] text-pink-700 rounded-lg hover:bg-pink-100"
                        >
                          Pakai Mode Preset / Upload
                        </button>
                      </div>
                    )}
                    <video
                      ref={setVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform -scale-x-100"
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Flash Overlay */}
                    {flashActive && (
                      <div className="absolute inset-0 bg-white animate-ping z-30 pointer-events-none" />
                    )}

                    {/* Visual Countdown Overlay */}
                    {countdown !== null && (
                      <div className="absolute inset-0 bg-pink-900/30 backdrop-blur-xs flex flex-col items-center justify-center z-20 space-y-2">
                        <span className="text-7xl font-mono font-extrabold text-white drop-shadow-md animate-bounce">
                          {countdown}
                        </span>
                        <button
                          type="button"
                          onClick={stopPhotoShoot}
                          className="px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-bold rounded-xl transition-all shadow-md"
                        >
                          Batal Foto
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Online Multiplayer Player Status Bar */}
              {lobbyMode === 'multiplayer' && (() => {
                const pKeys = session ? Object.keys(session.players) : [];
                const activePlayersList = session ? Object.values(session.players).filter(p => p.active) : [];
                const myP = session?.players[playerId];
                const partnerP = pKeys.map(k => session?.players[k]).find(p => p && p.id !== playerId);

                return (
                  <div className="w-full bg-pink-50/80 border border-pink-100 rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                    <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-start">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="font-bold text-slate-700">{myP?.name || 'Kamu'}:</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${myP?.isReady ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                          {myP?.isReady ? '✓ SIAP' : 'BELUM SIAP'}
                        </span>
                      </div>

                      <div className="text-slate-300 font-bold hidden sm:inline">|</div>

                      <div className="flex items-center space-x-1.5">
                        {partnerP ? (
                          <>
                            <span className="font-bold text-slate-700">{partnerP.name}:</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${partnerP.isReady ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                              {partnerP.isReady ? '✓ SIAP' : 'BELUM SIAP'}
                            </span>
                          </>
                        ) : (
                          <span className="text-pink-600 font-medium italic animate-pulse">
                            Menunggu Player 2 bergabung...
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-pink-600 bg-white px-2 py-1 rounded-lg border border-pink-200 uppercase tracking-wider text-[11px]">
                        Kode: {roomCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (roomCode) {
                            navigator.clipboard.writeText(roomCode);
                            alert(`Kode Room ${roomCode} berhasil disalin!`);
                          }
                        }}
                        className="px-2 py-1 bg-white hover:bg-pink-100 text-pink-700 rounded-lg text-[11px] font-bold border border-pink-200 transition-all flex items-center space-x-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Salin Kode</span>
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Action Controls */}
              <div className="w-full flex items-center justify-between pt-2">
                <button
                  type="button"
                  disabled={localShootActive}
                  onClick={() => {
                    stopPhotoShoot();
                    goToStep(2);
                  }}
                  className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all whitespace-nowrap ${
                    localShootActive 
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : 'bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-200'
                  }`}
                >
                  ← Ubah Frame
                </button>

                {localShootActive ? (
                  <button
                    type="button"
                    disabled
                    className="px-4 py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold text-xs rounded-xl flex items-center space-x-1.5 whitespace-nowrap cursor-default animate-pulse"
                  >
                    <Lock className="w-4 h-4 text-emerald-600" />
                    <span>Sesi Foto Berjalan... (Foto {localPhotoIndex + 1} dari 4)</span>
                  </button>
                ) : isCapturing ? (
                  <button
                    type="button"
                    onClick={stopPhotoShoot}
                    className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1.5 whitespace-nowrap"
                  >
                    <XCircle className="w-4 h-4 text-white" />
                    <span>Batalkan Foto</span>
                  </button>
                ) : lobbyMode === 'solo' ? (
                  <button
                    type="button"
                    onClick={startFullPhotoShootSequence}
                    className="px-4 py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs rounded-xl shadow-xs shadow-pink-200 transition-all flex items-center space-x-1.5 whitespace-nowrap"
                  >
                    <Camera className="w-4 h-4 text-white" />
                    <span>Mulai Ambil Foto</span>
                  </button>
                ) : (() => {
                  const activePlayersList = session ? Object.values(session.players).filter(p => p.active) : [];
                  const myP = session?.players[playerId];

                  // 1. Check if the active photo-session is in progress (countdown or active take)
                  if (session?.status === 'countdown' || session?.status === 'taking') {
                    if (isUploading) {
                      return (
                        <button
                          type="button"
                          disabled
                          className="px-4 py-2.5 bg-amber-50 text-amber-600 border border-amber-200 font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5 whitespace-nowrap"
                        >
                          <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />
                          <span>Mengirim Foto ke Frame...</span>
                        </button>
                      );
                    }
                    
                    const activeIndex = (session?.currentPhotoIndex !== undefined) ? session.currentPhotoIndex : 0;
                    return (
                      <button
                        type="button"
                        disabled
                        className="px-4 py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold text-xs rounded-xl flex items-center space-x-1.5 whitespace-nowrap cursor-default animate-pulse"
                      >
                        <Camera className="w-4 h-4 text-emerald-600" />
                        <span>Mengambil Foto ke-{activeIndex + 1} dari 4</span>
                      </button>
                    );
                  }

                  // 2. Otherwise we are waiting for player readiness to start/restart the session
                  if (activePlayersList.length < 2) {
                    return (
                      <button
                        type="button"
                        disabled
                        className="px-4 py-2.5 bg-slate-100 text-slate-400 font-bold text-xs rounded-xl border border-slate-200 cursor-not-allowed flex items-center space-x-1.5 whitespace-nowrap"
                      >
                        <Users className="w-4 h-4" />
                        <span>Menunggu Player 2 Gabung...</span>
                      </button>
                    );
                  }

                  if (myP?.isReady) {
                    return (
                      <button
                        type="button"
                        onClick={handleToggleReady}
                        className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1.5 whitespace-nowrap"
                      >
                        <RefreshCw className="w-4 h-4 text-white animate-spin" />
                        <span>Menunggu Pasangan Siap (Klik Batal)</span>
                      </button>
                    );
                  }

                  return (
                    <button
                      type="button"
                      onClick={handleToggleReady}
                      className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs shadow-emerald-200 transition-all flex items-center space-x-1.5 whitespace-nowrap"
                    >
                      <Check className="w-4 h-4 text-white" />
                      <span>Saya Siap (Ready)</span>
                    </button>
                  );
                })()}
              </div>

              {/* Live 4 Shots Collage Status & Retake Panel */}
              <div className="w-full pt-3 border-t border-pink-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-slate-700">
                    {lobbyMode === 'multiplayer' ? 'Hasil Collage 2 Orang (Kanan - Kiri)' : 'Hasil Snapshot Foto Strip'}
                  </p>
                  <button
                    type="button"
                    onClick={handleRetakeAllPhotos}
                    className="text-[11px] font-bold text-pink-600 hover:text-pink-700 flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Ulangi Semua (Reset)</span>
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[0, 1, 2, 3].map((slotIdx) => {
                    const activeS = lobbyMode === 'solo' ? soloSession : session;
                    const pKeys = activeS ? Object.keys(activeS.players) : [];
                    
                    // Deterministic ordering: Host (creator) is always p1, guest (partner) is always p2
                    const creatorId = activeS?.creatorId;
                    const p1 = (activeS && creatorId && activeS.players[creatorId]) 
                      ? activeS.players[creatorId] 
                      : (activeS ? activeS.players[pKeys[0]] : null);
                    
                    const partnerId = activeS && creatorId ? pKeys.find(id => id !== creatorId) : pKeys[1];
                    const p2 = (lobbyMode === 'multiplayer' && activeS && partnerId) ? activeS.players[partnerId] : null;

                    const p1Img = p1?.photos[slotIdx];
                    const p2Img = p2?.photos[slotIdx];
                    const isTaken = p1Img || p2Img;
                    const isCurrentSlot = activeConfig.currentPhotoIndex === slotIdx;

                    return (
                      <div 
                        key={slotIdx}
                        className={`relative aspect-4/3 rounded-xl overflow-hidden border transition-all flex flex-col justify-center items-center ${
                          isCurrentSlot 
                            ? 'ring-2 ring-pink-500 border-pink-400 shadow-sm' 
                            : 'border-pink-200 bg-pink-50/40'
                        }`}
                      >
                        {p2 ? (
                          /* 2-Player Side-by-Side Collage Preview */
                          <div className="w-full h-full flex relative">
                            <div className="w-1/2 h-full relative border-r border-white/80 bg-pink-100/50 flex items-center justify-center overflow-hidden">
                              {p1Img ? (
                                <img src={p1Img} alt={`P1 Shot ${slotIdx+1}`} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[9px] font-bold text-pink-500">P1 📷</span>
                              )}
                            </div>
                            <div className="w-1/2 h-full relative bg-purple-100/50 flex items-center justify-center overflow-hidden">
                              {p2Img ? (
                                <img src={p2Img} alt={`P2 Shot ${slotIdx+1}`} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[9px] font-bold text-purple-500">P2 📷</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* Solo Photo Preview */
                          p1Img ? (
                            <img src={p1Img} alt={`Shot ${slotIdx+1}`} className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-pink-300">
                              <Camera className="w-4 h-4" />
                              <span className="text-[10px] font-medium mt-0.5">#{slotIdx + 1}</span>
                            </div>
                          )
                        )}

                        {/* Individual Retake Overlay Button */}
                        {isTaken && (
                          <button
                            type="button"
                            onClick={() => handleRetakeSinglePhoto(slotIdx)}
                            title={`Ulangi Foto Ke-${slotIdx + 1}`}
                            className="absolute inset-0 bg-slate-900/60 hover:bg-slate-900/80 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold p-1 gap-1"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Ulangi #{slotIdx + 1}</span>
                          </button>
                        )}

                        {/* Active slot indicator badge */}
                        {isCurrentSlot && !isTaken && (
                          <span className="absolute top-1 left-1 bg-pink-500 text-white text-[8px] font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                            Aktif
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: EDIT & PILIH FILTER */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full max-w-4xl bg-white border border-pink-100 rounded-3xl p-4 sm:p-6 shadow-xl shadow-pink-100/40 flex flex-col lg:flex-row gap-6 my-auto"
            >
              {/* Left Column: Live Canvas Render Preview */}
              <div className="lg:w-1/2 flex flex-col items-center justify-center bg-pink-50/40 p-4 rounded-2xl border border-pink-100">
                <p className="text-[11px] font-mono font-bold text-pink-600 uppercase mb-3">Hasil Strip & Preview Filter</p>
                {final2RUrl ? (
                  <img
                    src={final2RUrl}
                    alt="Preview Strip"
                    className="max-h-[320px] sm:max-h-[380px] w-auto object-contain rounded-xl shadow-lg border border-pink-100"
                  />
                ) : (
                  <div className="h-64 w-32 bg-pink-100/50 rounded-xl animate-pulse flex items-center justify-center text-xs text-pink-400">
                    Memuat Strip...
                  </div>
                )}
              </div>

              {/* Right Column: Aesthetic Filter & Frame Selector */}
              <div className="lg:w-1/2 flex flex-col justify-between space-y-4">
                <div className="space-y-4 overflow-y-auto max-h-[360px] pr-1">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 mb-0.5">Pilih Filter Aesthetic</h3>
                    <p className="text-xs text-slate-500 mb-2">Pilih filter terbaik untuk mempercantik foto strip kamu.</p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {FILTERS.map((filter) => (
                        <button
                          key={filter.id}
                          type="button"
                          onClick={() => handleUpdateConfig({ filterId: filter.id })}
                          className={`py-2 px-3 rounded-xl border text-xs text-left flex items-center justify-between transition-all whitespace-nowrap ${
                            activeConfig.filterId === filter.id
                              ? 'bg-pink-500 text-white border-pink-500 shadow-xs font-bold'
                              : 'bg-pink-50/30 border-pink-100 text-slate-700 hover:border-pink-300 hover:bg-pink-50/60'
                          }`}
                        >
                          <span className="font-semibold text-xs truncate">{filter.name}</span>
                          {activeConfig.filterId === filter.id && <Check className="w-3.5 h-3.5 text-white flex-shrink-0 ml-1" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-800 mb-0.5">Pilih Warna Frame</h3>
                    <p className="text-xs text-slate-500 mb-2">Ubah warna bingkai foto sesuai selera.</p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {OVERLAYS.map((overlay) => (
                        <button
                          key={overlay.id}
                          type="button"
                          onClick={() => handleUpdateConfig({ overlayId: overlay.id })}
                          className={`py-2 px-3 rounded-xl border text-left transition-all flex items-center justify-between whitespace-nowrap ${
                            activeConfig.overlayId === overlay.id
                              ? 'ring-2 ring-pink-500 border-pink-400 shadow-xs font-bold'
                              : 'border-pink-100 hover:border-pink-300'
                          }`}
                          style={{ backgroundColor: overlay.bg }}
                        >
                          <span className="text-xs font-bold truncate" style={{ color: overlay.text }}>{overlay.name}</span>
                          {activeConfig.overlayId === overlay.id && (
                            <Check className="w-3.5 h-3.5 flex-shrink-0 ml-1" style={{ color: overlay.text }} />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Step Actions */}
                <div className="flex items-center space-x-2 pt-3 border-t border-pink-100">
                  <button
                    type="button"
                    onClick={() => goToStep(3)}
                    className="flex-1 py-2.5 px-3 bg-pink-50 hover:bg-pink-100 text-pink-700 font-semibold text-xs rounded-xl flex items-center justify-center space-x-1 border border-pink-200 transition-all whitespace-nowrap"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Ulangi Foto</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => goToStep(5)}
                    className="flex-1 py-2.5 px-3 bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1 transition-all shadow-md shadow-pink-200 whitespace-nowrap"
                  >
                    <span>Lanjut ke Ekspor</span>
                    <ChevronRight className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 5: HASIL, LIVE PHOTO & MENU EKSPOR */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-4xl bg-white border border-pink-100 rounded-3xl p-4 sm:p-6 shadow-xl shadow-pink-100/40 flex flex-col space-y-6 my-auto"
            >
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Column: Final Export Render Preview */}
                <div className="lg:w-1/2 flex flex-col items-center justify-center bg-pink-50/40 p-4 rounded-2xl border border-pink-100">
                  <p className="text-[11px] font-mono font-bold text-pink-600 uppercase mb-3">Preview Hasil Cetak Strip</p>
                  {final2RUrl ? (
                    <img
                      src={final2RUrl}
                      alt="Hasil Photobooth"
                      className="max-h-[340px] sm:max-h-[380px] w-auto object-contain rounded-xl shadow-lg border border-pink-100"
                    />
                  ) : (
                    <div className="h-64 w-32 bg-pink-100/50 rounded-xl animate-pulse flex items-center justify-center text-xs text-pink-400">
                      Menyiapkan hasil...
                    </div>
                  )}
                </div>

                {/* Right Column: Complete Download Actions */}
                <div className="lg:w-1/2 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 mb-0.5">Menu Ekspor & Download</h3>
                    <p className="text-xs text-slate-500 mb-3">Simpan foto Strip 2R, Cetak 4R, atau Animasi GIF Live Photo.</p>

                    <div className="space-y-2">
                      {/* Download 2R Strip */}
                      <a
                        href={final2RUrl}
                        download={`Photobooth_2R_Strip_${roomCode || 'Solo'}.png`}
                        className="w-full py-2.5 px-3 bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-xs shadow-pink-200 transition-all whitespace-nowrap"
                      >
                        <Download className="w-4 h-4 text-white" />
                        <span>Download 2R Strip (PNG)</span>
                      </a>

                      {/* Download 4R Layout Grid */}
                      <a
                        href={final4RUrl}
                        download={`Photobooth_4R_Grid_${roomCode || 'Solo'}.png`}
                        className="w-full py-2.5 px-3 bg-pink-50 hover:bg-pink-100 text-pink-700 font-semibold text-xs rounded-xl flex items-center justify-center space-x-2 border border-pink-200 transition-all whitespace-nowrap"
                      >
                        <Download className="w-4 h-4 text-pink-600" />
                        <span>Download 4R Print Grid (PNG)</span>
                      </a>

                      {/* Download Animated GIF Strip */}
                      {gifUrl ? (
                        <a
                          href={gifUrl}
                          download={`Photobooth_Animated_Strip_${roomCode || 'Solo'}.gif`}
                          className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-xs transition-all whitespace-nowrap"
                        >
                          <Download className="w-4 h-4 text-white" />
                          <span>Download Strip Animated GIF</span>
                        </a>
                      ) : (
                        <div className="w-full py-2.5 px-3 bg-pink-50/50 border border-pink-100 rounded-xl text-pink-600 text-xs flex items-center justify-center space-x-2 whitespace-nowrap">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-pink-500" />
                          <span>{gifLoading ? 'Memproses Animasi GIF...' : 'Menyiapkan Animated GIF...'}</span>
                        </div>
                      )}

                      {/* Native Web Share Button (Mobile friendly) */}
                      <button
                        type="button"
                        onClick={() => handleSharePhoto(final2RUrl, 'Photobooth Abuy', 'Photobooth_2R_Strip.png')}
                        className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-xs transition-all whitespace-nowrap"
                      >
                        <Share2 className="w-4 h-4 text-white" />
                        <span>Bagikan Foto Ke Sosmed</span>
                      </button>

                      {/* Copy Share Link */}
                      {roomCode && (
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className="w-full py-2.5 px-3 bg-pink-50 hover:bg-pink-100 text-pink-700 font-semibold text-xs rounded-xl flex items-center justify-center space-x-2 border border-pink-200 transition-all whitespace-nowrap"
                        >
                          <Share2 className="w-4 h-4 text-pink-600" />
                          <span>{copied ? 'Tersalin ke Clipboard!' : 'Bagikan Link Room Photobooth'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Restart Option */}
                  <div className="pt-2 border-t border-pink-100">
                    <button
                      type="button"
                      onClick={() => goToStep(1)}
                      className="w-full py-2.5 bg-pink-50 hover:bg-pink-100 text-pink-700 font-semibold text-xs rounded-xl flex items-center justify-center space-x-2 border border-pink-200 transition-all whitespace-nowrap"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Mulai Foto Baru</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* LIVE PHOTO SECTION IN EXPORT MENU */}
              <div className="border-t border-pink-100 pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-pink-600 uppercase tracking-wider">Koleksi Live Photo (Individual GIF)</h4>
                    <p className="text-[11px] text-slate-500">Sentuh atau sentuhkan kursor untuk melihat animasi gerak live photo. Download GIF per shot.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[0, 1, 2, 3].map((idx) => {
                    const activeSession = lobbyMode === 'solo' ? soloSession : session;
                    const p1 = activeSession ? Object.values(activeSession.players)[0] : null;
                    const photoSrc = p1?.photos[idx];
                    const burst = p1?.livePhotos?.[idx];
                    const isPlayingLive = livePlaybackIndex === idx && burst && burst.length > 0;
                    const currentFrameSrc = isPlayingLive ? burst[liveFrameIndex] : photoSrc;

                    return (
                      <div
                        key={idx}
                        className="bg-pink-50/40 border border-pink-100 rounded-2xl p-2.5 flex flex-col space-y-2 transition-all hover:border-pink-300 shadow-xs"
                      >
                        <div
                          className="relative aspect-4/3 bg-slate-100 rounded-xl overflow-hidden cursor-pointer group border border-pink-100"
                          onMouseEnter={() => startLivePhotoPlayback(idx)}
                          onMouseLeave={stopLivePhotoPlayback}
                          onTouchStart={() => startLivePhotoPlayback(idx)}
                          onTouchEnd={stopLivePhotoPlayback}
                        >
                          {currentFrameSrc ? (
                            <img
                              src={currentFrameSrc}
                              alt={`Shot ${idx + 1}`}
                              className="w-full h-full object-cover transform transition-transform group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-pink-300 font-mono">
                              Kosong
                            </div>
                          )}

                          <div className="absolute top-1.5 left-1.5 bg-slate-900/80 backdrop-blur-xs text-[10px] text-white px-2 py-0.5 rounded-full font-bold">
                            Shot #{idx + 1}
                          </div>

                          {burst && burst.length > 0 && (
                            <div className="absolute bottom-1.5 right-1.5 bg-pink-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded flex items-center space-x-1 shadow-xs">
                              <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                              <span>LIVE</span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col space-y-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => downloadLivePhoto(idx)}
                            disabled={liveGifLoading[idx]}
                            className="w-full py-1.5 px-2 bg-pink-500 hover:bg-pink-600 text-white text-[11px] font-bold rounded-xl flex items-center justify-center space-x-1 transition-all shadow-xs shadow-pink-200 disabled:opacity-50 min-h-[36px]"
                          >
                            <Download className="w-3 h-3 text-white" />
                            <span>{liveGifLoading[idx] ? 'Proses...' : 'Live GIF'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRetakePhoto(idx)}
                            className="w-full py-1 px-2 bg-white hover:bg-pink-100 text-pink-700 text-[10px] font-medium rounded-lg border border-pink-200 flex items-center justify-center space-x-1 transition-all"
                          >
                            <RefreshCw className="w-2.5 h-2.5" />
                            <span>Foto Ulang</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* 3. Footer */}
      <footer className="h-8 flex-shrink-0 bg-neutral-950 border-t border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-between px-6 z-40">
        <span className="font-semibold text-neutral-300">Photobooth Abuy</span>
        <span className="font-medium text-neutral-400">Dibuat untuk Ghina dari Aghna</span>
      </footer>

    </div>
  );
}
