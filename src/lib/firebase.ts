import { initializeApp, getApps, getApp } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import type { Auth } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import type { FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCmuDrq-ctHOGu4Fe9gHoK2Fxhcfg3BE9g",
  authDomain: "calendario-estrategico.firebaseapp.com",
  projectId: "calendario-estrategico",
  storageBucket: "calendario-estrategico.firebasestorage.app",
  messagingSenderId: "941508404506",
  appId: "1:941508404506:web:af82455df11b35359538a3"
};

// Fazemos a inicialização por demanda para NUNCA gerar erro no carregamento da página
let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

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

export const getFirebaseAuth = (): Auth => {
  if (!authInstance) initFirebase();
  return authInstance!;
};

export const getFirebaseDb = (): Firestore => {
  if (!dbInstance) initFirebase();
  return dbInstance!;
};

export const getFirebaseStorage = (): FirebaseStorage => {
  if (!storageInstance) initFirebase();
  return storageInstance!;
};

export const loginWithEmail = async (email: string, pass: string) => {
  try {
    const auth = getFirebaseAuth();
    const result = await signInWithEmailAndPassword(auth, email, pass);
    
    // Check user approval status in Firestore
    const db = getFirebaseDb();
    const userDoc = await getDoc(doc(db, "users", result.user.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.role === 'pending') {
        // Sign out the user - they haven't been approved yet
        await signOut(auth);
        throw new Error('PENDING_APPROVAL');
      }
    }
    
    return result.user;
  } catch (error) {
    console.error("Erro ao autenticar com email:", error);
    throw error;
  }
};

export const registerWithEmail = async (email: string, pass: string, nome: string) => {
  try {
    const auth = getFirebaseAuth();
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    
    // Create user document in Firestore with 'pending' role
    const db = getFirebaseDb();
    await setDoc(doc(db, "users", result.user.uid), {
      email: email,
      nome: nome,
      role: 'pending',
      createdAt: serverTimestamp()
    });
    
    // Sign out immediately — user must be approved first
    await signOut(auth);
    
    return result.user;
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    throw error;
  }
};

export const logout = async () => {
  const auth = getFirebaseAuth();
  return await signOut(auth);
};
