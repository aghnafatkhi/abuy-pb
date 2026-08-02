import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

let firebaseConfig = {
  apiKey: "AIzaSyA8BUl8KQsJ-SaKO5N3RdzJzd4rgV7cUlc",
  authDomain: "theta-transit-0fs6l.firebaseapp.com",
  projectId: "theta-transit-0fs6l",
  storageBucket: "theta-transit-0fs6l.firebasestorage.app",
  messagingSenderId: "842405792691",
  appId: "1:842405792691:web:fb9d15fc40e176ab6519c6",
};

let databaseId = 'ai-studio-webphotobooth-64520635-a97c-4cc9-ab73-a06412542710';

// Try reading dynamic config on server side to be 100% resilient
if (typeof window === 'undefined') {
  try {
    const fs = require('fs');
    const path = require('path');
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf8');
      const parsed = JSON.parse(raw);
      firebaseConfig = {
        apiKey: parsed.apiKey || firebaseConfig.apiKey,
        authDomain: parsed.authDomain || firebaseConfig.authDomain,
        projectId: parsed.projectId || firebaseConfig.projectId,
        storageBucket: parsed.storageBucket || firebaseConfig.storageBucket,
        messagingSenderId: parsed.messagingSenderId || firebaseConfig.messagingSenderId,
        appId: parsed.appId || firebaseConfig.appId,
      };
      if (parsed.firestoreDatabaseId) {
        databaseId = parsed.firestoreDatabaseId;
      }
    }
  } catch (e) {
    console.warn('Could not load dynamic firebase config, using default', e);
  }
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, databaseId);
