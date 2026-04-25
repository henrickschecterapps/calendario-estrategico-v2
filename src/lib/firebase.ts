import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCmuDrq-ctHOGu4Fe9gHoK2Fxhcfg3BE9g",
  authDomain: "calendario-estrategico.firebaseapp.com",
  projectId: "calendario-estrategico",
  storageBucket: "calendario-estrategico.firebasestorage.app",
  messagingSenderId: "941508404506",
  appId: "1:941508404506:web:af82455df11b35359538a3"
};

// Fazemos a inicialização por demanda para NUNCA gerar erro no carregamento da página
let appInstance: any = null;
let authInstance: any = null;
let dbInstance: any = null;
let storageInstance: any = null;

export const initFirebase = () => {
  if (typeof window === "undefined") return; // Evita falhas no servidor

  try {
    if (!getApps().length) {
      appInstance = initializeApp(firebaseConfig);
    } else {
      appInstance = getApp();
    }
    
    if (!authInstance) authInstance = getAuth(appInstance);
    if (!dbInstance) dbInstance = getFirestore(appInstance);
    if (!storageInstance) storageInstance = getStorage(appInstance);
  } catch (err) {
    console.error("Falha silenciosa ao inicializar firebase", err);
  }
};

export const getFirebaseAuth = () => {
  if (!authInstance) initFirebase();
  return authInstance;
};

export const getFirebaseDb = () => {
  if (!dbInstance) initFirebase();
  return dbInstance;
};

export const getFirebaseStorage = () => {
  if (!storageInstance) initFirebase();
  return storageInstance;
};

export const loginWithEmail = async (email: string, pass: string) => {
  try {
    const auth = getFirebaseAuth();
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error) {
    console.error("Erro ao autenticar com email:", error);
    throw error;
  }
};

export const logout = async () => {
  const auth = getFirebaseAuth();
  return await signOut(auth);
};
