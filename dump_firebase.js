const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, limit, query } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyCmuDrq-ctHOGu4Fe9gHoK2Fxhcfg3BE9g",
  authDomain: "calendario-estrategico.firebaseapp.com",
  projectId: "calendario-estrategico",
  storageBucket: "calendario-estrategico.firebasestorage.app",
  messagingSenderId: "941508404506",
  appId: "1:941508404506:web:af82455df11b35359538a3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function dump() {
  const q = query(collection(db, 'eventos'), limit(15));
  const snap = await getDocs(q);
  const data = snap.docs.map(d => ({id: d.id, ...d.data()}));
  
  if (data.length === 0) {
    console.log("NO EVENTS FOUND!");
    return;
  }

  // Dump distinct keys across all events to find the right property names
  const allKeys = new Set();
  data.forEach(ev => Object.keys(ev).forEach(k => allKeys.add(k)));
  console.log("ALL KNOWN KEYS IN DB:", Array.from(allKeys).join(', '));
  
  // Find an event that has members or brindes
  const complexEvents = data.filter(e => 
    Object.keys(e).some(k => k.toLowerCase().includes('participante') || k.toLowerCase().includes('equipe') || k.toLowerCase().includes('brinde') || k.toLowerCase() === 'vagas')
  );
  
  if (complexEvents.length > 0) {
    console.log("FOUND events with complex data. First one:", JSON.stringify(complexEvents[0], null, 2));
  } else {
    console.log("Just a standard event:", JSON.stringify(data[0], null, 2));
  }
}

dump().then(() => process.exit(0)).catch(console.error);
